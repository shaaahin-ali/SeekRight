from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas import QueryRequest, QueryResponse
from app.database import get_db
from app.models import Session as DBSession, Transcript, TranscriptChunk, ProcessingStatus
from app.services.chunking_service import ensure_chunks
from app.services.embedding_service import embed_query
from app.services.retrieval_service import build_faiss_index, search

import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/query", response_model=QueryResponse)
async def query_transcript(request: QueryRequest, db: Session = Depends(get_db)):
    start_time = time.time()
    if not request.context_id:
        raise HTTPException(status_code=400, detail="context_id (session) required")
    
    try:
        session_id = int(request.context_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid context_id format")

    session_record = db.query(DBSession).filter(DBSession.session_id == session_id).first()
    if not session_record:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session_record.processing_status != ProcessingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Querying not allowed. Session processing status is not COMPLETED.")
        
    transcript = db.query(Transcript).filter(Transcript.session_id == session_id).first()
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")
        
    if not transcript.full_text or not transcript.full_text.strip():
        logger.info(f"[Query] context={session_id} chunk_count=0 empty transcript.")
        return QueryResponse(answer="Safe failure: Transcript is empty.", sources=[])
        
    # Concurrency-safe lazy chunking with mandatory transaction boundary
    # No silent swallowing of exceptions: failures propagate to API layer exactly as requested.
    with db.begin():
        ensure_chunks(db, session_id, session_record.subject_id, transcript.full_text)
    
    # Reload chunks after confirmed transaction commit
    chunks = db.query(TranscriptChunk).filter(TranscriptChunk.session_id == session_id).order_by(TranscriptChunk.chunk_index).all()
    chunk_count = len(chunks)
    
    if not chunks:
        logger.info(f"[Query] context={session_id} chunk_count={chunk_count} no chunks.")
        return QueryResponse(answer="No relevant content found in transcript.", sources=[])
        
    if chunk_count > 2000:
        logger.warning(f"[Query] context={session_id} chunk_count={chunk_count} memory safety guard triggered.")
        raise HTTPException(status_code=413, detail="Transcript too large for memory processing")
        
    chunk_texts = [c.chunk_text for c in chunks]
    index, _ = build_faiss_index(chunk_texts)
    
    query_vector = embed_query(request.question)
    
    # Explicit threshold (1.5) for audit transparency
    valid_results, top_distance = search(index, query_vector, top_k=5, threshold=1.5)
    
    latency_ms = (time.time() - start_time) * 1000
    logger.info(f"[Query] context={session_id} chunk_count={chunk_count} top_distance={top_distance:.3f} latency_ms={latency_ms:.1f}ms query='{request.question}'")
    
    if not valid_results:
        return QueryResponse(answer="No relevant content found in transcript.", sources=[])
        
    # STRICT ANSWER CONSTRUCTION
    # Strategy: Filtered by similarity threshold, then returned in narrative order (enumerated).
    valid_indices = {idx for dist, idx in valid_results}
    dist_map = {idx: dist for dist, idx in valid_results}
    
    seen = set()
    selected_chunks = []
    sources = []
    
    for idx, chunk in enumerate(chunks):
        if idx in valid_indices:
            if chunk.chunk_text not in seen:
                seen.add(chunk.chunk_text)
                selected_chunks.append(chunk.chunk_text)
                sources.append(f"chunk_index_{chunk.chunk_index}_dist_{dist_map[idx]:.3f}")
            
    answer = "\n\n".join(selected_chunks)
    
    return QueryResponse(answer=answer, sources=sources)
