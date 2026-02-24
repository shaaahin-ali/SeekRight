from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import engine, get_db
from app import models
from app.routers import auth, session, query

app = FastAPI(title="SeekRight API")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(session.router, prefix="/api", tags=["Session"])
app.include_router(query.router, prefix="/api", tags=["Query"])




@app.get("/")
def root():
    return {"message": "SeekRight Backend Running"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=503, detail="Database unreachable")


