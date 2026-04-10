from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import engine, get_db
from app import models
from app.routers import auth, query, sessions
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SeekRight API",
    description="AI-powered YouTube knowledge retrieval backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── DB Init ───────────────────────────────────────────────────────────────────
models.Base.metadata.create_all(bind=engine)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(sessions.router, prefix="/api", tags=["Sessions"])
app.include_router(query.router, prefix="/api", tags=["Query"])

# ── Health Checks ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"message": "SeekRight API is running", "docs": "/docs"}

@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}

@app.get("/health/db", tags=["Health"])
def health_db(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception:
        raise HTTPException(status_code=503, detail="Database unreachable")
