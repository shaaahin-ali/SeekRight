# SeekRight 🔍

**AI-powered YouTube knowledge retrieval.** Paste any YouTube URL, let Whisper transcribe it, then ask questions and get answers grounded in the video content — powered by vector search (FAISS) and Mistral AI.

[![Backend — Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://render.com)
[![Frontend — Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel)](https://vercel.com)

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite + Tailwind CSS v4 + Framer Motion |
| Backend | FastAPI + SQLAlchemy + SQLite |
| Transcription | OpenAI Whisper (`base` model) + yt-dlp |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` |
| Vector Search | FAISS (in-memory, per-query) |
| LLM | Mistral AI (`mistral-small-latest`) |

---

## Project Structure

```
SeekRight/
├── backend/          # FastAPI app
│   ├── app/
│   │   ├── main.py         # Entry point, CORS, router registration
│   │   ├── database.py     # SQLite / SQLAlchemy setup
│   │   ├── models/         # ORM models (User, Subject, Session, Transcript, Chunk)
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── routers/        # auth, sessions, query
│   │   └── services/       # transcription, embedding, retrieval, LLM, chunk, session
│   ├── alembic/            # DB migrations
│   ├── .env.example        # Copy → .env and fill in keys
│   └── requirements.txt
└── frontend/         # Vite + React app
    ├── src/
    │   ├── pages/Dashboard.tsx
    │   ├── components/ui/  # shape-landing-hero, sign-in-flow, ai-prompt-box
    │   └── App.tsx
    ├── .env.example        # Copy → .env.local and set VITE_API_URL
    └── vercel.json
```

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- [ffmpeg](https://ffmpeg.org/download.html) installed and on your PATH
- A free [Mistral AI API key](https://console.mistral.ai)

### Backend

```bash
cd backend

# 1. Create and activate venv
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up environment
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
# then edit .env and paste your MISTRAL_API_KEY

# 4. Run
uvicorn app.main:app --reload --port 8000
```

API docs available at → http://localhost:8000/docs

### Frontend

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Set up environment
copy .env.example .env.local   # Windows
# cp .env.example .env.local   # macOS/Linux
# Edit .env.local:
#   VITE_API_URL=http://localhost:8000

# 3. Run
npm run dev
```

App available at → http://localhost:5173

---

## Deployment

### Backend → Render (Free Tier)

1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) → **New → Web Service**.
3. Connect your GitHub repo.
4. Set these settings (or use the included `render.yaml` for auto-config):

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Runtime | `Python 3` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

5. Under **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `MISTRAL_API_KEY` | your Mistral key |
| `FRONTEND_URL` | your Vercel URL, e.g. `https://seekright.vercel.app` |

6. Click **Deploy**. Wait ~5 min for first build (Whisper + sentence-transformers are large).
7. Copy your Render URL — you'll need it for the frontend.

> **Note on ffmpeg:** Render's free Linux environment includes ffmpeg by default. No extra config needed.

> **Note on SQLite:** The SQLite DB is ephemeral on Render's free tier (disk resets on redeploy). This is fine for demos. For persistence, upgrade to a paid plan with a disk mount or switch to PostgreSQL.

---

### Frontend → Vercel (Free Tier)

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import your GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Vite** (auto-detected).
4. Under **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | Your Render backend URL (no trailing slash), e.g. `https://seekright-backend.onrender.com` |

5. Click **Deploy**. Done in ~60 seconds.

---

## How It Works

```
User pastes YouTube URL
       ↓
yt-dlp downloads audio → Whisper transcribes → Chunks stored in SQLite
       ↓
User asks a question
       ↓
sentence-transformers embeds question → FAISS finds closest chunks
       ↓
Mistral AI generates a grounded answer
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Sign in (demo stub) |
| `POST` | `/api/session` | Create session + start transcription |
| `GET` | `/api/session/{id}/status` | Poll processing status |
| `POST` | `/api/query` | Ask a question against a session |
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Interactive API docs (Swagger) |

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `MISTRAL_API_KEY` | ✅ | Mistral AI key from console.mistral.ai |
| `FRONTEND_URL` | Prod only | Vercel URL for CORS allowlist |

### Frontend (`frontend/.env.local`)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Prod only | Render backend base URL |

---

## License

MIT