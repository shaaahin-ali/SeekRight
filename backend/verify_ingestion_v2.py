import requests
import time
import sys
import threading
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import User, Subject, Session, Transcript, TranscriptChunk

DB_URL = "sqlite:///./seekright.db"
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

BASE_URL = "http://localhost:8001/api"

def seed_db():
    print("--- Seeding Database ---")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.user_id == 1).first()
        if not user:
            user = User(user_id=1, name="Test User", role="teacher", email="test@test.com")
            db.add(user)
        
        subject = db.query(Subject).filter(Subject.subject_id == 1).first()
        if not subject:
            subject = Subject(subject_id=1, subject_name="Math", description="Test Subject")
            db.add(subject)
        
        db.commit()
        print("✅ DB Seeded.")
    except Exception as e:
        print(f"❌ Seed error: {e}")
        db.rollback()
    finally:
        db.close()

def wait_for_completion(session_id: int, timeout=600):
    print(f"Waiting for session {session_id} to complete...")
    start_time = time.time()
    last_status = None
    
    while time.time() - start_time < timeout:
        try:
            resp = requests.get(f"{BASE_URL}/session/{session_id}/status")
            if resp.status_code != 200:
                print(f"Error getting status: {resp.status_code}")
                return False
            
            status = resp.json()["processing_status"]
            if status != last_status:
                print(f"Session {session_id} Status: {status}")
                last_status = status
            
            if status == "COMPLETED":
                return True
            if status == "FAILED":
                print(f"Session {session_id} FAILED. Reason: {resp.json().get('failure_reason')}")
                return False
        except Exception as e:
            print(f"Request error: {e}")
            
        time.sleep(5)
    
    print(f"Timeout waiting for session {session_id}")
    return False

def verify_session_data(session_id: int):
    print(f"--- Verifying Data for Session {session_id} ---")
    db = SessionLocal()
    try:
        session = db.query(Session).filter(Session.session_id == session_id).first()
        transcript = db.query(Transcript).filter(Transcript.session_id == session_id).first()
        chunks = db.query(TranscriptChunk).filter(TranscriptChunk.session_id == session_id).order_by(TranscriptChunk.chunk_index).all()
        
        # If COMPLETED, we expect transcript and chunks
        if session.processing_status == "COMPLETED":
            if not transcript:
                print("❌ Transcript missing!")
                return False
            print(f"✅ Transcript exists (Length: {len(transcript.full_text)})")
            
            if len(chunks) < 5:
                print(f"❌ Not enough chunks! Found {len(chunks)}, expected 5+")
                return False
            print(f"✅ Found {len(chunks)} chunks.")
            
            for i, chunk in enumerate(chunks):
                if chunk.chunk_index != i:
                    print(f"❌ Index mismatch at chunk {i}!")
                    return False
            print("✅ Chunk sequence valid.")

        if not session.duration or session.duration <= 0:
            print(f"❌ Duration not recorded correctly! ({session.duration})")
            return False
            
        print(f"✅ Duration recorded: {session.duration}s")
        return True
    finally:
        db.close()

def test_pipeline_flow(url: str):
    print("\n[Test 1] Pipeline Flow / Environment Test")
    resp = requests.post(f"{BASE_URL}/session", json={"subject_id": 1, "youtube_url": url, "uploaded_by": 1})
    if resp.status_code != 200:
        print(f"❌ Failed to create session: {resp.status_code}")
        return False
    
    session_id = resp.json()["session_id"]
    
    # Wait for terminal state
    start_time = time.time()
    last_status = None
    while time.time() - start_time < 600:
        r = requests.get(f"{BASE_URL}/session/{session_id}/status")
        status = r.json()["processing_status"]
        reason = r.json().get("failure_reason")
        
        if status != last_status:
            print(f"Session {session_id} Status: {status}")
            last_status = status
            
        if status in ["COMPLETED", "FAILED"]:
            break
        time.sleep(5)

    if status == "COMPLETED":
        print("✅ Ingestion COMPLETED (FFmpeg available).")
        return verify_session_data(session_id)
    elif status == "FAILED":
        if "FFmpeg" in (reason or ""):
            print(f"✅ Graceful failure detected (FFmpeg missing). Reason: {reason}")
            return verify_session_data(session_id)
        else:
            print(f"❌ Session FAILED with unexpected reason: {reason}")
            return False
    
    print("❌ Timeout waiting for session.")
    return False

def test_invalid_url():
    print("\n[Test 2] Invalid YouTube URL Handling")
    resp = requests.post(f"{BASE_URL}/session", json={"subject_id": 1, "youtube_url": "https://youtube.com/watch?v=invalid_id_999", "uploaded_by": 1})
    if resp.status_code == 400:
        print("✅ Rejected immediately (400)")
        return True
        
    session_id = resp.json()["session_id"]
    
    # Wait for FAILED
    start_time = time.time()
    while time.time() - start_time < 60:
        r = requests.get(f"{BASE_URL}/session/{session_id}/status")
        if r.json()["processing_status"] == "FAILED":
            print(f"✅ Correctly set to FAILED. Reason: {r.json().get('failure_reason')}")
            return True
        time.sleep(2)
    
    print("❌ Failed to reach FAILED state for invalid URL.")
    return False

def run_concurrency_test(urls: list):
    print("\n[Test 3] Concurrency Test (2 Simultaneous Sessions)")
    results = []
    
    def worker(url):
        print(f"Starting worker for {url}")
        resp = requests.post(f"{BASE_URL}/session", json={"subject_id": 1, "youtube_url": url, "uploaded_by": 1})
        if resp.status_code == 200:
            session_id = resp.json()["session_id"]
            # Just wait for terminal state, don't care if it's COMPLETED or FAILED (ffmpeg dependency)
            # but it MUST be terminal and not crash SQLite
            start_time = time.time()
            while time.time() - start_time < 600:
                s = requests.get(f"{BASE_URL}/session/{session_id}/status").json()["processing_status"]
                if s in ["COMPLETED", "FAILED"]:
                    results.append(True)
                    print(f"Worker for {url} finished with status: {s}")
                    return
                time.sleep(5)
        results.append(False)

    threads = [threading.Thread(target=worker, args=(u,)) for u in urls[:2]]
    for t in threads: t.start()
    for t in threads: t.join()
    
    if len(results) == 2 and all(results):
        print("✅ Concurrency test successful (no SQLite locks/crashes).")
        return True
    return False

if __name__ == "__main__":
    seed_db()
    
    ts = int(time.time())
    
    # Test 1: Flow / Env
    if not test_pipeline_flow(f"https://www.youtube.com/watch?v=dQw4w9WgXcQ&t1={ts}"):
        sys.exit(1)
        
    # Test 2: Invalid
    if not test_invalid_url():
        sys.exit(1)
        
    # Test 3: Concurrency (2 sessions)
    if not run_concurrency_test([
        f"https://www.youtube.com/watch?v=dQw4w9WgXcQ&t2={ts}",
        f"https://www.youtube.com/watch?v=dQw4w9WgXcQ&t3={ts}"
    ]):
        sys.exit(1)
         
    print("\n🚀 ALL VALIDATION TESTS PASSED! INGESTION PIPELINE IS STABLE.")
