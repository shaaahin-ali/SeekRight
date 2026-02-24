from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.schemas import SessionCreate, SessionResponse
from app.database import get_db
from app.services.session_service import (
    create_session,
    get_session_status,
    process_session
)

router = APIRouter()


@router.post("/session", response_model=SessionResponse)
def create_session_route(
    session_data: SessionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    session = create_session(db, session_data)

    # THIS LINE WAS MISSING
    background_tasks.add_task(process_session, session.session_id)

    return session


@router.get("/session/{session_id}/status", response_model=SessionResponse)
def get_session_status_route(
    session_id: int,
    db: Session = Depends(get_db)
):
    session = get_session_status(db, session_id)
    return session