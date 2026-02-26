import math
from sqlalchemy.orm import Session
from app.models import TranscriptChunk

def chunk_text(full_text: str, chunk_size: int = 700):
    words = full_text.split()
    chunks = []

    total_words = len(words)
    num_chunks = math.ceil(total_words / chunk_size)

    for i in range(num_chunks):
        start = i * chunk_size
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append((i, chunk))

    return chunks

def ensure_chunks(db: Session, session_id: int, subject_id: int, full_text: str):
    """
    Lazily generate chunks if they don't exist.
    Caller MUST manage the transaction (commit/rollback).
    """
    # Check if chunks already exist (simple check)
    existing = db.query(TranscriptChunk).filter_by(session_id=session_id).first()
    if existing:
        return  # Already chunked

    raw_chunks = chunk_text(full_text)
    new_chunks = [
        TranscriptChunk(
            session_id=session_id,
            subject_id=subject_id,
            chunk_text=text,
            chunk_index=index
        ) for index, text in raw_chunks
    ]
    
    db.add_all(new_chunks)
