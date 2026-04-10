from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.job import Job
from app.database import get_db
from app.workers.tasks import process_video

router = APIRouter()

@router.post("/process")
def process_video_api(video_url: str, db: Session = Depends(get_db)):
    job = Job(video_url=video_url, status="pending")
    db.add(job)
    db.commit()
    db.refresh(job)

    process_video.delay(job.id)  # async task

    return {"job_id": job.id, "status": job.status}

@router.get("/status/{job_id}")
def get_status(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    return {"status": job.status}
