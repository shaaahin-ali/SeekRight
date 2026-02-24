import time
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app import models
from app.database import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_session(db: Session, data):
    subject = db.query(models.Subject).filter(
        models.Subject.subject_id == data.subject_id
    ).first()

    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    user = db.query(models.User).filter(
        models.User.user_id == data.uploaded_by
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(models.Session).filter(
        models.Session.youtube_url == data.youtube_url
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Session already exists")

    new_session = models.Session(
        subject_id=data.subject_id,
        youtube_url=data.youtube_url,
        uploaded_by=data.uploaded_by,
        processing_status=models.ProcessingStatus.PENDING
    )

    db.add(new_session)
    
    try:
        db.commit()
        db.refresh(new_session)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Session with this YouTube URL already exists")

    return new_session


def get_session_status(db: Session, session_id: int):
    session = db.query(models.Session).filter(
        models.Session.session_id == session_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return session


def process_session(session_id: int):
    db = SessionLocal()

    try:
        # Fetch with a row lock to prevent concurrent workers processing the same session
        session = db.query(models.Session).filter(
            models.Session.session_id == session_id
        ).with_for_update().first()

        if not session:
            return

        if session.processing_status == models.ProcessingStatus.COMPLETED:
            logger.info("Session already COMPLETED. Skipping.")
            return
            
        existing_transcript = db.query(models.Transcript).filter(
            models.Transcript.session_id == session_id
        ).first()
        
        if existing_transcript:
            logger.info("Transcript already exists. Skipping.")
            return

        session.processing_status = models.ProcessingStatus.PROCESSING
        session.started_at = datetime.utcnow()
        db.commit()
        logger.info(f"Session {session_id} moved to PROCESSING")

        # Simulate long-running Whisper task
        time.sleep(5)

        with db.begin():
            # Cascade Safe-Guard: re-fetch the session inside the transaction
            # to check if it was deleted mid-processing
            check_session = db.query(models.Session).filter(
                models.Session.session_id == session_id
            ).first()
            
            if not check_session:
                logger.warning(f"Session {session_id} was deleted mid-processing. Aborting transcript insertion.")
                return

            check_session.processing_status = models.ProcessingStatus.COMPLETED
            check_session.completed_at = datetime.utcnow()
            db.add(models.Transcript(
                session_id=session_id,
                full_text="Dummy transcript text generated.",
                language="english"
            ))

        logger.info(f"Session {session_id} moved to COMPLETED")

    except Exception as e:
        logger.error(f"Error processing session {session_id}: {str(e)}")
        try:
            failed_session = db.query(models.Session).filter(
                models.Session.session_id == session_id
            ).first()
            if failed_session:
                failed_session.processing_status = models.ProcessingStatus.FAILED
                failed_session.failure_reason = str(e)
                failed_session.completed_at = datetime.utcnow()
                db.commit()
        except Exception:
            pass

    finally:
        db.close()