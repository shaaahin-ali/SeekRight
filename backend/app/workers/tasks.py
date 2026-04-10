from app.core.celery_app import celery
from app.database import SessionLocal
from app.models.job import Job

from app.services.ingestion_service import download_audio
from app.services.transcription_service import transcribe
from app.services.embedding_service import embed_and_store

@celery.task
def process_video(job_id: int):
    db = SessionLocal()

    job = db.query(Job).filter(Job.id == job_id).first()
    job.status = "processing"
    db.commit()

    try:
        audio_path = download_audio(job.video_url)
        transcript = transcribe(audio_path)
        embed_and_store(transcript)

        job.status = "completed"

    except Exception as e:
        job.status = "failed"

    db.commit()
    db.close()
