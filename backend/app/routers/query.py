from fastapi import APIRouter
from app.schemas import QueryRequest, QueryResponse

router = APIRouter()

@router.post("/query", response_model=QueryResponse)
async def query_transcript(request: QueryRequest):
    # Placeholder for RAG logic
    return {
        "answer": f"You asked: {request.question}. This is a placeholder answer.",
        "sources": ["source1.txt", "source2.txt"]
    }