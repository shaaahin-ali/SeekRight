from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.schemas import SessionCreate, SessionResponse, SessionStatusResponse
from app.database import get_db
from app.services.session_service import create_session, get_session_status, process_session

router = APIRouter()


@router.post("/session", response_model=SessionResponse, status_code=201)
def create_new_session(
    data: SessionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Create a new session and kick off background transcription."""
    new_session = create_session(db, data)
    # Run processing in a background task (no Celery needed on free tier)
    background_tasks.add_task(process_session, new_session.session_id)
    return new_session


@router.get("/session/{session_id}/status", response_model=SessionStatusResponse)
def get_status(session_id: int, db: Session = Depends(get_db)):
    """Poll the processing status of a session."""
    return get_session_status(db, session_id)
