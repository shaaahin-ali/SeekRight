from fastapi import FastAPI
from app.database import engine
from app import models
from app.routers import auth, session, query

# Create tables
models.Base.metadata.create_all(bind=engine)

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


