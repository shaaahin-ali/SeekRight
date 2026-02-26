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
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

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
            logger.info(f"Session {session_id} already COMPLETED. Skipping.")
            return
            
        existing_transcript = db.query(models.Transcript).filter(
            models.Transcript.session_id == session_id
        ).first()
        
        if existing_transcript:
            logger.info(f"Transcript already exists for session {session_id}. skipping.")
            return

        session.processing_status = models.ProcessingStatus.PROCESSING
        session.started_at = datetime.utcnow()
        db.commit()
        logger.info(f"Session {session_id} moved to PROCESSING")

        # 1. TRANSCRIPTION STAGE (with 1 retry)
        max_retries = 1
        attempt = 0
        transcription_result = None
        
        session.processing_status = models.ProcessingStatus.TRANSCRIBING
        db.commit()
        logger.info(f"Session {session_id} moved to TRANSCRIBING")

        from app.services.transcription_service import transcribe
        
        while attempt <= max_retries:
            try:
                logger.info(f"Transcription attempt {attempt + 1} for session {session_id}")
                transcription_result = transcribe(session.youtube_url)
                break
            except Exception as e:
                attempt += 1
                if attempt > max_retries:
                    logger.error(f"Transcription failed after {max_retries + 1} attempts: {str(e)}")
                    raise e
                logger.warning(f"Transcription attempt {attempt} failed, retrying... Error: {str(e)}")

        full_text = transcription_result["full_text"]
        language = transcription_result["language"]
        segments = transcription_result["segments"]

        # 2. CHUNKING STAGE
        session.processing_status = models.ProcessingStatus.CHUNKING
        db.commit()
        logger.info(f"Session {session_id} moved to CHUNKING")

        from app.services.chunk_service import generate_chunks
        try:
            chunks_data = generate_chunks(
                full_text=full_text,
                segments=segments,
                session_id=session_id,
                subject_id=session.subject_id
            )
        except Exception as e:
            logger.error(f"Chunking failed for session {session_id}: {str(e)}")
            raise e

        # 3. PERSISTENCE STAGE
        with db.begin():
            check_session = db.query(models.Session).filter(
                models.Session.session_id == session_id
            ).first()
            
            if not check_session:
                logger.warning(f"Session {session_id} was deleted mid-processing. Aborting persistence.")
                return

            # Persist Transcript
            db.add(models.Transcript(
                session_id=session_id,
                full_text=full_text,
                language=language
            ))

            # Persist Chunks
            for chunk_dict in chunks_data:
                db.add(models.TranscriptChunk(
                    session_id=chunk_dict["session_id"],
                    subject_id=chunk_dict["subject_id"],
                    chunk_text=chunk_dict["chunk_text"],
                    start_time=chunk_dict["start_time"],
                    end_time=chunk_dict["end_time"],
                    chunk_index=chunk_dict["chunk_index"]
                ))

            check_session.processing_status = models.ProcessingStatus.COMPLETED
            check_session.completed_at = datetime.utcnow()
            
            if check_session.started_at:
                duration = (check_session.completed_at - check_session.started_at).total_seconds()
                check_session.duration = float(duration)

        logger.info(f"Session {session_id} moved to COMPLETED")

    except Exception as e:
        error_msg = str(e)
        end_time = datetime.utcnow()
        logger.error(f"Error processing session {session_id}: {error_msg}")
        try:
            # Create a new DB session for error handling to avoid transaction issues
            error_db = SessionLocal()
            failed_session = error_db.query(models.Session).filter(
                models.Session.session_id == session_id
            ).first()
            if failed_session:
                failed_session.processing_status = models.ProcessingStatus.FAILED
                failed_session.failure_reason = error_msg
                failed_session.completed_at = end_time
                if failed_session.started_at:
                    duration = (end_time - failed_session.started_at).total_seconds()
                    failed_session.duration = float(duration)
                error_db.commit()
                logger.info(f"Session {session_id} marked as FAILED in DB (Duration: {failed_session.duration}s).")
            error_db.close()
        except Exception as err_log_e:
            logger.error(f"Critical: Failed to log error state for session {session_id}: {str(err_log_e)}")

    finally:
        db.close()
