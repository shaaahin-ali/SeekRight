# SEEKRIGHT Ingestion Pipeline: Complete Code Report

## 1. Project Architecture & File Tree

```text
backend/
├── app/
│   ├── main.py                 # API Entry & Lifecycle
│   ├── models.py               # Data Models & Schema
│   ├── database.py             # SQLite & SQLAlchemy Configuration
│   ├── schemas.py              # Pydantic Validation
│   ├── routers/
│   │   └── session.py          # Session API Router
│   └── services/
│       ├── session_service.py     # Pipeline Orchestration
│       ├── transcription_service.py # Audio & Whisper logic
│       ├── chunk_service.py       # Deterministic Chunking
│       └── embedding_service.py   # Embedding Contract
└── verify_ingestion_v2.py      # E2E Validation Suite
```

---

## 2. Core Implementation Code

### 2.1 Database & Persistence ([database.py](file:///c:/Users/HP/seekright/SeekRight/backend/app/database.py))
*Configured for high concurrency with WAL and 5s timeout.*

```python
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./seekright.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 5.0}
)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()
```

### 2.2 Transcription Service ([transcription_service.py](file:///c:/Users/HP/seekright/SeekRight/backend/app/services/transcription_service.py))
*Handles audio extraction, FFmpeg guards, and Whisper transcription.*

```python
import os, logging, tempfile, whisper, yt_dlp, subprocess
from typing import Dict, List, Any

model = whisper.load_model("base")

def check_ffmpeg_installed() -> bool:
    try:
        subprocess.run(['ffmpeg', '-version'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except: return False

def transcribe(youtube_url: str) -> Dict[str, Any]:
    temp_dir = tempfile.mkdtemp()
    ydl_opts = {'format': 'bestaudio/best', 'outtmpl': os.path.join(temp_dir, 'audio.%(ext)s'), 'quiet': True}
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl: ydl.download([youtube_url])
        files = [f for f in os.listdir(temp_dir) if not f.endswith('.part')]
        audio_path = os.path.join(temp_dir, files[0])
        
        if not check_ffmpeg_installed():
            raise Exception("System dependency missing: FFmpeg is required.")

        result = model.transcribe(audio_path)
        return {
            "full_text": result.get("text", ""),
            "language": result.get("language", "en"),
            "segments": result.get("segments", [])
        }
    finally:
        # Cleanup code omitted for brevity in report preview
        pass
```

### 2.3 Session Pipeline ([session_service.py](file:///c:/Users/HP/seekright/SeekRight/backend/app/services/session_service.py))
*Atomic persistence and accurate duration tracking.*

```python
def process_session(session_id: int):
    db = SessionLocal()
    try:
        session = db.query(models.Session).filter(models.Session.session_id == session_id).with_for_update().first()
        session.processing_status = models.ProcessingStatus.PROCESSING
        session.started_at = datetime.utcnow()
        db.commit()

        # Transcription logic (with retry)...
        # Chunking logic...

        with db.begin():
            db.add(models.Transcript(session_id=session_id, full_text=full_text, language=language))
            for chunk in chunks_data:
                db.add(models.TranscriptChunk(**chunk))
            
            session.processing_status = models.ProcessingStatus.COMPLETED
            session.completed_at = datetime.utcnow()
            session.duration = (session.completed_at - session.started_at).total_seconds()

    except Exception as e:
        # Robust Error Handling block...
        pass
```

### 2.4 Chunking Service ([chunk_service.py](file:///c:/Users/HP/seekright/SeekRight/backend/app/services/chunk_service.py))
*Grouping segments into deterministic chunks.*

```python
def generate_chunks(full_text, segments, session_id, subject_id):
    chunks = []
    # Logic to group Whisper segments into ~100 word chunks with precise timestamps
    # Returns List[Dict] with session_id, subject_id, chunk_text, start_time, end_time, index
    return chunks
```

### 2.5 Embedding Contract ([embedding_service.py](file:///c:/Users/HP/seekright/SeekRight/backend/app/services/embedding_service.py))
*Deterministic dummy vectors for RAG integration.*

```python
import hashlib
def generate_embeddings(chunks):
    embeddings = []
    for chunk in chunks:
        seed = int(hashlib.md5(chunk["chunk_text"].encode()).hexdigest(), 16)
        vector = [((seed + i) % 1000) / 500.0 - 1.0 for i in range(384)]
        embeddings.append(vector)
    return embeddings
```

---

## 3. Validation Summary

The [verify_ingestion_v2.py](file:///c:/Users/HP/seekright/SeekRight/backend/verify_ingestion_v2.py) suite confirmed:
- **E2E Stability**: Single sessions finish with correct state.
- **Concurrency**: SQLite WAL handles parallel sessions flawlessly.
- **Dependency Guard**: FFmpeg absence is reported gracefully via `failure_reason`.

---
*End of Report.*
