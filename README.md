# SeekRight

> **AI-powered YouTube knowledge retrieval system** — Paste any YouTube URL, get instant answers with precise timestamps, powered by vector search and Mistral AI.

**Live Demo:** (https://seekright.vercel.app)

---

## What is SeekRight?

Instead of watching an entire YouTube video to find one piece of information, SeekRight lets you:
- **Paste a YouTube link** → System transcribes the audio
- **Ask natural questions** → Get answers grounded in video content
- **Get timestamps** → Jump directly to relevant moments in the video

Perfect for research, learning, and quickly extracting insights from long-form video content.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Query                                │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │  sentence-transformers          │
        │  (Embed question locally)       │
        └────────────────┬────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │  FAISS Vector Search            │
        │  (Find closest chunks fast)     │
        └────────────────┬────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │  Mistral AI LLM                 │
        │  (Generate grounded answer)     │
        └────────────────┬────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │  Answer + Timestamp             │
        │  (Delivered to user)            │
        └────────────────────────────────┘
```

**Key Design Decisions:**
- **Local embeddings** (sentence-transformers) → Cost-efficient, no API calls for every query
- **FAISS vector search** → Sub-millisecond retrieval on large transcripts
- **Mistral AI** → Fast, accurate LLM for answer generation
- **Async processing** → Handle multiple video transcriptions concurrently

---

## Tech Stack

| Layer | Technology | Why? |
|-------|-----------|------|
| **Frontend** | React 19 + Vite + Tailwind CSS v4 | Modern, fast build times, responsive UI |
| **Backend** | FastAPI + SQLAlchemy | Async-first, automatic API docs, type-safe |
| **Transcription** | OpenAI Whisper + yt-dlp | Accurate transcription, supports any YouTube video |
| **Embeddings** | sentence-transformers (all-MiniLM-L6-v2) | Semantic understanding, runs locally |
| **Vector DB** | FAISS | Lightning-fast similarity search at scale |
| **LLM** | Mistral AI (mistral-small-latest) | Cost-effective, fast inference |
| **Database** | SQLite (PostgreSQL ready) | Stores sessions, transcripts, embeddings |

---

## Project Structure

```
SeekRight/
│
├── backend/                          # FastAPI application
│   ├── app/
│   │   ├── main.py                  # Entry point, CORS, routes
│   │   ├── database.py              # SQLAlchemy setup
│   │   ├── models/                  # ORM models (User, Session, Chunk, etc.)
│   │   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── auth.py              # Authentication
│   │   │   ├── sessions.py          # Video session management
│   │   │   └── query.py             # Query answering
│   │   └── services/
│   │       ├── transcription.py     # Whisper + yt-dlp integration
│   │       ├── embedding.py         # sentence-transformers wrapper
│   │       ├── retrieval.py         # FAISS search logic
│   │       ├── llm.py               # Mistral API calls
│   │       └── chunking.py          # Smart text chunking
│   ├── alembic/                     # Database migrations
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/                         # React + Vite
    ├── src/
    │   ├── pages/
    │   │   └── Dashboard.tsx        # Main UI
    │   ├── components/
    │   │   ├── VideoInput.tsx       # URL paste + upload
    │   │   ├── QueryBox.tsx         # Question input
    │   │   ├── AnswerCard.tsx       # Results display
    │   │   └── VideoPlayer.tsx      # Timeline jumper
    │   └── App.tsx
    ├── vercel.json                  # Vercel deployment config
    ├── .env.example
    └── package.json
```

---

## Quick Start

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **FFmpeg** ([download](https://ffmpeg.org/download.html)) — needed for audio extraction
- **Mistral AI API Key** — [Get free API key](https://console.mistral.ai) (includes free credits)

### Backend Setup

```bash
cd backend

# 1. Create virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate          # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env and paste your MISTRAL_API_KEY

# 4. Run server
uvicorn app.main:app --reload --port 8000
```

**API docs:** http://localhost:8000/docs (Swagger UI auto-generated)

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local:
#   VITE_API_URL=http://localhost:8000

# 3. Start dev server
npm run dev
```

**App:** http://localhost:5173

---

## Deployment

### Backend → Render (Free Tier, ~5 min)

1. Push repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo, select `backend` as root directory
4. Set these environment variables:
   - `MISTRAL_API_KEY`: Your Mistral API key
   - `FRONTEND_URL`: Your Vercel URL (for CORS)

**Build Command:** `pip install -r requirements.txt`  
**Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

> **Note:** First deploy takes ~5 min (Whisper + sentence-transformers are large files). Subsequent deploys are faster.

### Frontend → Vercel (Free Tier, ~1 min)

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo, set root directory to `frontend`
3. Add environment variable:
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://seekright-backend.onrender.com`)

Done! Automatic deployments on every push.

---

## How It Works (Technical)

### 1. **Video Transcription**
```python
# yt-dlp downloads audio → Whisper transcribes with timestamps
audio_path = extract_audio(youtube_url)  # yt-dlp
transcript = transcribe(audio_path)      # OpenAI Whisper
```

### 2. **Smart Chunking**
```python
# Split transcript into overlapping chunks for better context
chunks = smart_chunk(transcript, chunk_size=300, overlap=50)
```

### 3. **Embedding & Storage**
```python
# Convert chunks to embeddings locally (no API cost)
embeddings = sentence_transformer.encode(chunks)
faiss_index.add(embeddings)  # Store for fast retrieval
```

### 4. **Query Answering**
```python
# User question → Embed → Find similar chunks → Generate answer
query_embedding = sentence_transformer.encode(user_question)
closest_chunks = faiss_index.search(query_embedding, top_k=5)
answer = mistral_llm(question, context=closest_chunks)
```

---

## Performance Metrics

| Operation | Time | Notes |
|-----------|------|-------|
| Transcription (1 hour video) | ~2-3 min | Whisper `base` model |
| Embedding generation | ~500ms | Local, 100+ chunks |
| Vector search (FAISS) | <1ms | Sub-millisecond retrieval |
| Answer generation | ~2-3 sec | Mistral API call |
| **Total end-to-end** | ~3-5 min | First query, after transcription |

---

## What I Learned Building This

**Backend & RAG Pipeline:**
- Designed a complete RAG system from scratch (transcription → chunking → embeddings → retrieval → generation)
- Handled async video processing with proper concurrency control
- Optimized chunking strategy for long-form content (improved accuracy on 2+ hour videos)
- Integrated multiple APIs (Whisper, Mistral, yt-dlp) seamlessly

**Performance Optimization:**
- Used local embeddings to eliminate API latency on every query
- Implemented FAISS for sub-millisecond vector search
- Added intelligent chunk overlap to maintain context quality

**Full-Stack Integration:**
- Built production-ready FastAPI backend with automatic documentation
- Connected React frontend with real-time status polling
- Deployed on free tiers (Render + Vercel) without major compromises

**Problem Solving:**
- Debugged timestamp misalignment between transcription and video
- Implemented retry logic for flaky Mistral API calls
- Handled edge cases (videos with no speech, non-English audio)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/session` | Start new video session + transcription |
| `GET` | `/api/session/{id}/status` | Check transcription progress |
| `POST` | `/api/query` | Ask question against a session |
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Interactive API docs (Swagger) |

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc123",
    "question": "What is the main topic discussed?"
  }'
```

**Example Response:**
```json
{
  "answer": "The video discusses machine learning fundamentals...",
  "source_chunks": [
    {
      "text": "Machine learning is...",
      "timestamp": "0:45"
    }
  ]
}
```

---

## Environment Variables

### Backend (`.env`)
```env
MISTRAL_API_KEY=your_mistral_key_here
FRONTEND_URL=http://localhost:5173          # Dev
# FRONTEND_URL=https://seekright.vercel.app # Prod
```

### Frontend (`.env.local`)
```env
VITE_API_URL=http://localhost:8000          # Dev
# VITE_API_URL=https://seekright-backend.onrender.com # Prod
```

---

## License

MIT — Feel free to use, modify, and deploy!

---

## Contributing

Found a bug or have an idea? Open an issue or submit a PR. I'd love feedback!

---

## About

Built by Shahin Ali as a showcase of full-stack AI development, RAG systems, and production deployments.

**Skills demonstrated:**
- RAG pipeline design & implementation
- FastAPI + async Python
- React modern frontend
- Vector databases (FAISS)
- LLM integration (Mistral)
- Deployment & DevOps (Render, Vercel)
- Problem-solving & debugging

---

Questions? Feel free to reach out!.
