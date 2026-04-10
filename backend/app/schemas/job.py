from pydantic import BaseModel

class JobCreate(BaseModel):
    video_url: str

class JobResponse(BaseModel):
    id: int
    status: str
