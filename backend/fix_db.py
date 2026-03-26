import sys
import os
import json
import logging

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Transcript
from app.services.llm_service import generate_summary_and_faqs_sync

def fix_all_transcripts():
    db = SessionLocal()
    transcripts = db.query(Transcript).all()
    count = 0
    for t in transcripts:
        if t.full_text and (not t.summary or len(t.summary) > 100 or t.summary.startswith("The video")):
            try:
                print(f"Generating for session {t.session_id}...")
                parsed = generate_summary_and_faqs_sync(t.full_text)
                t.summary = parsed.get("summary")
                t.faqs = json.dumps(parsed.get("faqs", []))
                db.commit()
                count += 1
                print(f"Saved session {t.session_id} - {t.summary}")
            except Exception as e:
                print(f"Error for session {t.session_id}: {e}")
                db.rollback()
    print(f"Updated {count} transcripts.")
    db.close()

if __name__ == "__main__":
    fix_all_transcripts()
