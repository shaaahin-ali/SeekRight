import requests
import time

def test_session_flow():
    base_url = "http://127.0.0.1:8001/api"
    
    # 1. Create Session
    payload = {
        "subject_id": 1,
        "youtube_url": f"https://youtube.com/test_{int(time.time())}",
        "uploaded_by": 123
    }
    print(f"Creating session: {payload}")
    try:
        resp = requests.post(f"{base_url}/session", json=payload)
        if resp.status_code != 200:
            print(f"Error {resp.status_code}: {resp.text}")
            return
        session_data = resp.json()
        session_id = session_data['session_id']
        print(f"Created Session ID: {session_id}, Status: {session_data['processing_status']}")
        
        # 2. Poll Status
        for i in range(8):
            time.sleep(1)
            status_resp = requests.get(f"{base_url}/session/{session_id}/status")
            status_data = status_resp.json()
            print(f"T+{i+1}s: Status: {status_data['processing_status']}")
            
            if status_data['processing_status'] == "COMPLETED":
                print("TEST PASSED: Status changed to COMPLETED!")
                return
            
        print("TEST FAILED: Status did not change to COMPLETED within 8 seconds.")
    except Exception as e:
        print(f"Error during test: {e}")

if __name__ == "__main__":
    test_session_flow()
