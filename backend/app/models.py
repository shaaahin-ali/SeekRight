import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class ProcessingStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    TRANSCRIBING = "TRANSCRIBING"
    CHUNKING = "CHUNKING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class User(Base):
    __tablename__ = "USERS"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("Session", back_populates="uploader")


class Subject(Base):
    __tablename__ = "SUBJECTS"

    subject_id = Column(Integer, primary_key=True, index=True)
    subject_name = Column(String, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("Session", back_populates="subject")


class Session(Base):
    __tablename__ = "SESSIONS"

    session_id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("SUBJECTS.subject_id"))
    youtube_url = Column(String, unique=True, index=True)
    audio_file_name = Column(String)
    transcript_source = Column(String, default="whisper")
    duration = Column(Float)
    uploaded_by = Column(Integer, ForeignKey("USERS.user_id"))
    processing_status = Column(Enum(ProcessingStatus), default=ProcessingStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    failure_reason = Column(Text, nullable=True)

    subject = relationship("Subject", back_populates="sessions")
    uploader = relationship("User", back_populates="sessions")
    transcript = relationship("Transcript", back_populates="session")


class Transcript(Base):
    __tablename__ = "TRANSCRIPTS"

    transcript_id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("SESSIONS.session_id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    full_text = Column(Text)
    language = Column(String, default="english")
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="transcript")


class TranscriptChunk(Base):
    __tablename__ = "TRANSCRIPT_CHUNKS"

    chunk_id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("SESSIONS.session_id"), index=True)
    subject_id = Column(Integer, ForeignKey("SUBJECTS.subject_id"), index=True)
    chunk_text = Column(Text, nullable=False)
    start_time = Column(Float)
    end_time = Column(Float)
    chunk_index = Column(Integer)