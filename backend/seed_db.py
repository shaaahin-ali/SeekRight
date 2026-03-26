"""
Seed script: ensures a default Subject and User exist in the database.
Run from the backend directory: python seed_db.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app import models

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Ensure default Subject exists
subject = db.query(models.Subject).filter_by(subject_id=1).first()
if not subject:
    db.add(models.Subject(
        subject_id=1,
        subject_name="General",
        description="Default subject for all video analyses"
    ))
    db.commit()
    print("✅ Default Subject (id=1) created.")
else:
    print("✓ Subject id=1 already exists:", subject.subject_name)

# Ensure default User exists
user = db.query(models.User).filter_by(user_id=1).first()
if not user:
    db.add(models.User(
        user_id=1,
        name="Default User",
        role="student",
        email="default@seekright.ai"
    ))
    db.commit()
    print("✅ Default User (id=1) created.")
else:
    print("✓ User id=1 already exists:", user.name)

db.close()
print("\nDone. You can now transcribe videos without getting 400 errors.")
