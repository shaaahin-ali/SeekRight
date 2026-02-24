from fastapi import FastAPI
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