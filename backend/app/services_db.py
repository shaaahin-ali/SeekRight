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


def get_session_by_url(youtube_url):
    db = SessionLocal()
    session = db.query(Session).filter(Session.youtube_url == youtube_url).first()
    db.close()
    return session


def create_youtube_session(subject_id, youtube_url, uploaded_by):
    db = SessionLocal()

    session = Session(
        subject_id=subject_id,
        youtube_url=youtube_url,
        audio_file_name=None,
        uploaded_by=uploaded_by
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    db.close()
    return session


def save_transcript(session_id, full_text):
    from .models import Transcript

    db = SessionLocal()

    transcript = Transcript(
        session_id=session_id,
        full_text=full_text
    )

    db.add(transcript)
    db.commit()
    db.refresh(transcript)

    db.close()
    return transcript

def save_chunks(session_id, subject_id, chunks):
    from .models import TranscriptChunk

    db = SessionLocal()

    for index, chunk in enumerate(chunks):
        db_chunk = TranscriptChunk(
            session_id=session_id,
            subject_id=subject_id,
            chunk_text=chunk["text"],
            start_time=chunk["start"],
            end_time=chunk["end"],
            chunk_index=index
        )
        db.add(db_chunk)

    db.commit()
    db.close()

