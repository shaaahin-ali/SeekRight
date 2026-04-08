from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas import QueryRequest, QueryResponse
from app.database import get_db
from app.models import Session as DBSession, Transcript, TranscriptChunk, ProcessingStatus
from app.services.embedding_service import embed_query
from app.services.retrieval_service import build_faiss_index, search
from app.services.llm_service import generate_answer

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

    session_record = db.query(DBSession).filter_by(session_id=session_id).first()
    if not session_record:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session_record.processing_status != ProcessingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Transcript processing not complete")

    transcript = db.query(Transcript).filter_by(session_id=session_id).first()
    if not transcript:
        # LOUD FAILURE: If session is COMPLETED, transcript MUST exist.
        logger.error(f"[Critical] Ingestion Error: COMPLETED session {session_id} has no transcript.")
        raise HTTPException(status_code=500, detail="Internal data integrity error (Missing transcript)")

    if not transcript.full_text or not transcript.full_text.strip():
        logger.info(f"[Query] context={session_id} empty transcript.")
        return QueryResponse(answer="No relevant content found in transcript.", sources=[])
    
    # REFEACTOR: Retrieval is strictly read-only. 
    # Lazy chunking (ensure_chunks) is REMOVED.
    chunks = db.query(TranscriptChunk).filter(TranscriptChunk.session_id == session_id).order_by(TranscriptChunk.chunk_index).all()
    chunk_count = len(chunks)
    
    if not chunks:
        # LOUD FAILURE: If session is COMPLETED, chunks MUST exist.
        logger.error(f"[Critical] Ingestion Error: COMPLETED session {session_id} has no chunks.")
        raise HTTPException(status_code=500, detail="Internal data integrity error (Missing chunks)")

    if chunk_count > 2000:
        logger.warning(f"[Query] context={session_id} memory safety guard triggered ({chunk_count} chunks).")
        raise HTTPException(status_code=413, detail="Transcript too large for memory processing")

    chunk_texts = [c.chunk_text for c in chunks]
    index, _ = build_faiss_index(chunk_texts)

    query_vector = embed_query(request.question)

    if len(query_vector.shape) == 1:
        query_vector = query_vector.reshape(1, -1)

    valid_results, top_distance = search(index, query_vector)

    logger.info(f"DEBUG VALID_RESULTS: {valid_results}")
    logger.info(f"DEBUG TOP_DISTANCE: {top_distance}")
    logger.info(f"DEBUG CHUNK_COUNT: {chunk_count}")

    latency_ms = (time.time() - start_time) * 1000

    safe_top_distance = (
        f"{top_distance:.3f}"
        if isinstance(top_distance, (int, float))
        else "N/A"
    )

    logger.info(
        f"[Query] context={session_id} "
        f"chunk_count={chunk_count} "
        f"top_dist={safe_top_distance} "
        f"lat_ms={latency_ms:.1f}ms "
        f"query='{request.question}'"
    )
    
    if not valid_results:
        # Fallback: if distance threshold filters out everything, fetch the top 3 regardless 
        # so the LLM at least has some context to summarize or deny it.
        D, I = index.search(query_vector.astype('float32'), 3)
        if D is not None and len(D) > 0 and len(D[0]) > 0:
            valid_indices = {idx for idx in I[0] if idx != -1}
            dist_map = {idx: dist for dist, idx in zip(D[0], I[0]) if idx != -1}
        else:
            return QueryResponse(answer="No relevant content found in transcript.", sources=[])
    else:
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
                sources.append(f"chunk_index_{chunk.chunk_index}_dist_{dist_map.get(idx, 0):.3f}")
            
    context_text = "\n\n".join(selected_chunks)

    try:
        llm_answer = await generate_answer(
            question=request.question,
            context=context_text,
            chat_history=request.chat_history
        )
    except Exception as e:
        logger.error(f"[Query] LLM Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"LLM integration error: {str(e)}")

    return QueryResponse(answer=llm_answer, sources=sources)
