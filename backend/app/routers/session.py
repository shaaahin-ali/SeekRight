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


from app.schemas import SessionDetailsResponse
from app import models

@router.get("/session/{session_id}", response_model=SessionDetailsResponse)
def get_session_details_route(
    session_id: int,
    db: Session = Depends(get_db)
):
    session = get_session_status(db, session_id)
    transcript = db.query(models.Transcript).filter_by(session_id=session_id).first()
    
    return SessionDetailsResponse(
        session_id=session.session_id,
        processing_status=session.processing_status.value if hasattr(session.processing_status, 'value') else session.processing_status,
        youtube_url=session.youtube_url,
        summary=transcript.summary if transcript else None,
        faqs=transcript.faqs if transcript else None,
        full_text=transcript.full_text if transcript else None
    )

from fastapi.responses import PlainTextResponse

@router.get("/session/{session_id}/transcript/raw")
def get_raw_transcript(
    session_id: int,
    db: Session = Depends(get_db)
):
    transcript = db.query(models.Transcript).filter_by(session_id=session_id).first()
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")
    return PlainTextResponse(content=transcript.full_text or "")