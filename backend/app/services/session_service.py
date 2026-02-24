import time
import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app import models
from app.database import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_session(db: Session, data):
    # Get or create subject
    subject = db.query(models.Subject).filter(
        models.Subject.subject_id == data.subject_id
    ).first()

    if not subject:
        logger.info(f"Subject {data.subject_id} not found. Creating a default one.")
        subject = models.Subject(
            subject_id=data.subject_id,
            subject_name=f"Subject {data.subject_id}",
            description="Automatically created subject"
        )
        db.add(subject)
        db.commit()
        db.refresh(subject)

    # Get or create user
    user = db.query(models.User).filter(
        models.User.user_id == data.uploaded_by
    ).first()

    if not user:
        logger.info(f"User {data.uploaded_by} not found. Creating a default one.")
        user = models.User(
            user_id=data.uploaded_by,
            name=f"User {data.uploaded_by}",
            role="teacher",
            email=f"user{data.uploaded_by}@example.com"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    existing = db.query(models.Session).filter(
        models.Session.youtube_url == data.youtube_url
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Session already exists")

    new_session = models.Session(
        subject_id=data.subject_id,
        youtube_url=data.youtube_url,
        uploaded_by=data.uploaded_by,
        processing_status="PENDING"
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

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
        session = db.query(models.Session).filter(
            models.Session.session_id == session_id
        ).first()

        if not session:
            return

        session.processing_status = "PROCESSING"
        db.commit()
        logger.info(f"Session {session_id} moved to PROCESSING")

        # Simulate long-running Whisper task
        time.sleep(5)

        session.processing_status = "COMPLETED"
        db.commit()
        logger.info(f"Session {session_id} moved to COMPLETED")

    except Exception as e:
        logger.error(f"Error processing session {session_id}: {str(e)}")
        if session:
            session.processing_status = "FAILED"
            db.commit()

    finally:
        db.close()