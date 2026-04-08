from typing import List, Dict, Any

def generate_chunks(full_text: str, segments: list, session_id: int, subject_id: int) -> List[Dict[str, Any]]:
    """
    Generates structured chunks from transcript segments.
    Each chunk dict includes session_id, subject_id, chunk_text, start_time, end_time, and chunk_index.
    
    This implementation groups Whisper segments into chunks of roughly 5-10 segments
    to ensure we have at least 5 chunks for average length videos and valid timestamps.
    """
    chunks = []
    
    if not segments:
        # Fallback if no segments provided: create one large chunk (though directive expects >= 5)
        # In a real scenario, we might split by character count or sentences.
        # But Whisper usually provides segments.
        chunks.append({
            "session_id": session_id,
            "subject_id": subject_id,
            "chunk_text": full_text,
            "start_time": 0.0,
            "end_time": 0.0, # Unknown without segments
            "chunk_index": 0
        })
        return chunks

    # Grouping logic: Try to create at least 5 chunks if possible.
    # We group segments to keep context together.
    segments_per_chunk = max(1, len(segments) // 5)
    
    current_segments = []
    chunk_index = 0
    
    for i, seg in enumerate(segments):
        current_segments.append(seg)
        
        # If we reached the target group size, or it's the last segment
        if (len(current_segments) >= segments_per_chunk and chunk_index < 4) or (i == len(segments) - 1):
            chunk_text = " ".join([s.get("text", "").strip() for s in current_segments])
            start_time = current_segments[0].get("start", 0.0)
            end_time = current_segments[-1].get("end", start_time)
            
            chunks.append({
                "session_id": session_id,
                "subject_id": subject_id,
                "chunk_text": chunk_text,
                "start_time": float(start_time),
                "end_time": float(end_time),
                "chunk_index": chunk_index
            })
            
            chunk_index += 1
            current_segments = []

    return chunks
