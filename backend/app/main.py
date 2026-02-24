from fastapi import FastAPI
<<<<<<< HEAD
from app.routers import auth, session, query

app = FastAPI(title="SeekRight API")

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(session.router, prefix="/api", tags=["Session"])
app.include_router(query.router, prefix="/api", tags=["Query"])

@app.get("/")
def root():
    return {"status": "SeekRight backend running"}

@app.get("/health")
def health():
    return {"status": "healthy"}
=======
from .services_db import create_subject

app = FastAPI()


@app.get("/")
def root():
    return {"message": "SeekRight Backend Running"}


@app.post("/create-subject")
def add_subject(name: str, description: str):
    subject = create_subject(name, description)
    return {
        "subject_id": subject.subject_id,
        "subject_name": subject.subject_name
    }
>>>>>>> origin/dev
