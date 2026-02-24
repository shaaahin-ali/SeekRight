from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from app import models
import time

# Create fresh tables just in case, Alembic got us covered but let's be sure
Base.metadata.create_all(bind=engine)

db = SessionLocal()
# Clean everything first
db.query(models.TranscriptChunk).delete()
db.query(models.Transcript).delete()
db.query(models.Session).delete()
db.query(models.Subject).delete()
db.query(models.User).delete()

# Seed User & Subject
user = models.User(user_id=1, name="Test User", role="teacher", email="test@test.com")
subject = models.Subject(subject_id=100, subject_name="Math", description="Test Subject")
db.add(user)
db.add(subject)
db.commit()

client = TestClient(app)

print("--- Running Verification ---")

# 7. Try creating session with invalid subject -> error
res = client.post("/api/session", json={
    "subject_id": 999,
    "youtube_url": "http://youtube.com/invalid",
    "uploaded_by": 1
})
assert res.status_code == 404, f"Expected 404 for invalid subject, got {res.status_code}"
print("✅ Invalid subject -> 404")

# Another test: invalid user -> error
res = client.post("/api/session", json={
    "subject_id": 100,
    "youtube_url": "http://youtube.com/invalid_user",
    "uploaded_by": 999
})
assert res.status_code == 404, f"Expected 404 for invalid user, got {res.status_code}"
print("✅ Invalid user -> 404")

# 1. Create session -> verify status PENDING
res = client.post("/api/session", json={
    "subject_id": 100,
    "youtube_url": "http://youtube.com/valid1",
    "uploaded_by": 1
})
assert res.status_code == 200, res.text
session_data = res.json()
session_id = session_data["session_id"]
assert session_data["processing_status"] == "PENDING"
print("✅ Create session -> PENDING")

# 8. Try duplicate youtube_url -> error
res = client.post("/api/session", json={
    "subject_id": 100,
    "youtube_url": "http://youtube.com/valid1",
    "uploaded_by": 1
})
assert res.status_code == 400
print("✅ Duplicate YouTube URL -> error")

# Background task should be running now. We sleep and poll status
print("Waiting for background task to process...")
time.sleep(1)
res = client.get(f"/api/session/{session_id}/status")
print(f"Status after 1s: {res.json()['processing_status']}")

time.sleep(5)
res = client.get(f"/api/session/{session_id}/status")
print(f"Status after 6s: {res.json()['processing_status']}")
assert res.json()['processing_status'] == "COMPLETED"
print("✅ Wait -> verify COMPLETED")

# 4. Confirm transcript row exists
db.expire_all()
transcript = db.query(models.Transcript).filter(models.Transcript.session_id == session_id).first()
assert transcript is not None
print("✅ Confirm transcript row exists")
transcript_id = transcript.transcript_id

# 5. Confirm second call does NOT create second transcript
from app.services.session_service import process_session
process_session(session_id)
count = db.query(models.Transcript).filter(models.Transcript.session_id == session_id).count()
assert count == 1, f"Expected exactly 1 transcript, found {count}"
print("✅ Idempotency: second call does not duplicate transcript")

# 6. Try deleting session -> transcript deleted
db.query(models.Session).filter(models.Session.session_id == session_id).delete()
db.commit()
db.expire_all()
deleted_transcript = db.query(models.Transcript).filter(models.Transcript.transcript_id == transcript_id).first()
assert deleted_transcript is None, "Transcript was not deleted upon cascade"
print("✅ Cascade: Deleting session deleted transcript")

print("--- ALL TESTS PASSED ---")

db.close()
