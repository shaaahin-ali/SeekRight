from fastapi import APIRouter, HTTPException
from app.schemas import SessionCreate, SessionResponse

router = APIRouter()

# In-memory storage for demo purposes
# In a real app, this would be a database
sessions = {}

@router.post("/session", response_model=SessionResponse)
async def create_session(session_data: SessionCreate):
    session_id = len(sessions) + 1
    sessions[session_id] = "PROCESSING"
    return {
        "session_id": session_id,
        "processing_status": "PROCESSING"
    }

@router.get("/session/{id}/status")
async def get_session_status(id: int):
    status = sessions.get(id)
    if not status:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": id,
        "processing_status": status
    }
