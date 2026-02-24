from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas import UserCreate, UserResponse

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    # Placeholder for registration logic
    return {"email": user.email, "id": 1, "is_active": True}

@router.post("/login")
async def login(user: UserCreate):
    # Placeholder for login logic
    return {"access_token": "dummy_token", "token_type": "bearer"}