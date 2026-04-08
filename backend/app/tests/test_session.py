from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_session():
    response = client.post(
        "/api/session",
        json={
            "subject_id": 1,
            "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "uploaded_by": 123
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert data["processing_status"] == "PROCESSING"
    return data["session_id"]

def test_get_session_status():
    # First create a session
    create_resp = client.post(
        "/api/session",
        json={
            "subject_id": 1,
            "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "uploaded_by": 123
        }
    )
    session_id = create_resp.json()["session_id"]
    
    # Then get its status
    response = client.get(f"/api/session/{session_id}/status")
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == session_id
    assert data["processing_status"] == "PROCESSING"

def test_get_invalid_session_status():
    response = client.get("/api/session/999/status")
    assert response.status_code == 404
    assert response.json()["detail"] == "Session not found"
