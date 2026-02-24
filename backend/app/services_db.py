from .database import SessionLocal
from .models import Subject, User, Session


def create_subject(name, description):
    db = SessionLocal()

    subject = Subject(subject_name=name, description=description)
    db.add(subject)
    db.commit()
    db.refresh(subject)

    db.close()
    return subject


def create_user(name, role, email):
    db = SessionLocal()

    user = User(name=name, role=role, email=email)
    db.add(user)
    db.commit()
    db.refresh(user)

    db.close()
    return user


def create_session(subject_id, youtube_url, audio_file_name, uploaded_by):
    db = SessionLocal()

    session = Session(
        subject_id=subject_id,
        youtube_url=youtube_url,
        audio_file_name=audio_file_name,
        uploaded_by=uploaded_by
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    db.close()
    return session