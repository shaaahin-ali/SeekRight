from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# Auth Schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

# Session Schemas
class SessionCreate(BaseModel):
    subject_id: int
    youtube_url: str
    uploaded_by: int

class SessionResponse(BaseModel):
    session_id: int
    processing_status: str

# Query Schemas
class QueryRequest(BaseModel):
    question: str
    context_id: Optional[str] = None

class QueryResponse(BaseModel):
    answer: str
    sources: List[str]