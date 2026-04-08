from .database import SessionLocal
from .models import User, Subject, Session

db = SessionLocal()

# Create Subject
physics = Subject(subject_name="Physics", description="Physics Lectures")
db.add(physics)
db.commit()
db.refresh(physics)

# Create User
teacher = User(name="Admin Teacher", role="teacher", email="teacher@example.com")
db.add(teacher)
db.commit()
db.refresh(teacher)

# Create Session (YouTube example)
session = Session(
    subject_id=physics.subject_id,
    youtube_url="https://youtube.com/example",
    audio_file_name="example.mp3",
    uploaded_by=teacher.user_id
)

db.add(session)
db.commit()
db.refresh(session)

print("Subject ID:", physics.subject_id)
print("User ID:", teacher.user_id)
print("Session ID:", session.session_id)

db.close()