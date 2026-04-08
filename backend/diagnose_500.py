from fastapi.testclient import TestClient
from app.main import app
import time

client = TestClient(app)

def diagnosis():
    payload = {
        "subject_id": 1,
        "youtube_url": f"https://youtube.com/final_diag_{int(time.time())}",
        "uploaded_by": 123
    }
    print(f"Testing locally with payload: {payload}")
    
    # 1. Create Session
    response = client.post("/api/session", json=payload)
    print(f"Create Status: {response.status_code}")
    session_id = response.json().get('session_id')
    print(f"Created Session ID: {session_id}")
    
    # 2. Immediate Status
    status_resp = client.get(f"/api/session/{session_id}/status")
    print(f"Initial Status: {status_resp.json().get('processing_status')}")
    
    # 3. Wait 6 seconds
    print("Waiting 6 seconds for background task...")
    time.sleep(6)
    
    # 4. Final Status
    status_resp = client.get(f"/api/session/{session_id}/status")
    final_status = status_resp.json().get('processing_status')
    print(f"Final Status: {final_status}")
    
    if final_status == "COMPLETED":
        print("DIAGNOSIS SUCCESS: Background task worked.")
    else:
        print(f"DIAGNOSIS FAILED: Background task did not complete. (Status: {final_status})")

if __name__ == "__main__":
    diagnosis()
