from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import engine, get_db
from app import models
from app.routers import auth, session, query
import logging
import subprocess
import yt_dlp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Startup Dependency Verification
def verify_dependencies():
    logger.info("--- Dependency Verification ---")
    
    # 1. yt-dlp check
    try:
        logger.info(f"✅ yt-dlp version: {yt_dlp.version.__version__}")
    except Exception as e:
        logger.error(f"❌ yt-dlp is NOT installed correctly: {e}")

    # 2. ffmpeg check
    try:
        res = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True, check=False)
        if res.returncode == 0:
            logger.info(f"✅ ffmpeg found: {res.stdout.splitlines()[0]}")
        else:
            logger.warning("⚠️ ffmpeg found but returned non-zero exit code.")
    except FileNotFoundError:
        logger.error("❌ ffmpeg NOT found in system PATH.")
    except Exception as e:
        logger.error(f"❌ Error checking ffmpeg: {e}")

verify_dependencies()

app = FastAPI(title="SeekRight API")

# CORS — allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
models.Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(session.router, prefix="/api", tags=["Session"])
app.include_router(query.router, prefix="/api", tags=["Query"])




@app.get("/")
def root():
    return {"message": "SeekRight Backend Running"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=503, detail="Database unreachable")


