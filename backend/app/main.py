from fastapi import FastAPI
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