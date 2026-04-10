import os
import logging
import tempfile
import shutil
import whisper
import yt_dlp
from typing import Dict, List, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import gc

# We will lazy-load the model inside the function to prevent out-of-memory on Render
# model = whisper.load_model("tiny")


def _ffmpeg_available() -> bool:
    """Check if ffmpeg is on PATH (works on Linux/Render and local)."""
    return shutil.which("ffmpeg") is not None


def transcribe(youtube_url: str) -> Dict[str, Any]:
    temp_dir = tempfile.mkdtemp()

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": os.path.join(temp_dir, "audio.%(ext)s"),
        "quiet": True,
        "no_warnings": True,
        "extractor_args": {
            "youtube": {
                "player_client": ["android", "web"]
            }
        }
    }

    try:
        logger.info(f"Downloading audio from: {youtube_url}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([youtube_url])

        files = [f for f in os.listdir(temp_dir) if not f.endswith(".part")]
        if not files:
            raise RuntimeError("yt-dlp produced no output file.")

        audio_path = os.path.join(temp_dir, files[0])
        logger.info(f"Downloaded audio to: {audio_path}")

        if not _ffmpeg_available():
            raise RuntimeError(
                "ffmpeg not found in PATH. "
                "On Render, add 'ffmpeg' to your system packages or use the Render dashboard."
            )

        logger.info(f"Loading Whisper 'tiny' model into memory...")
        model = whisper.load_model("tiny")
        logger.info(f"Transcribing: {audio_path}")
        result = model.transcribe(audio_path)
        
        # Free memory immediately to prevent Render from crashing
        del model
        gc.collect()

        return {
            "full_text": result.get("text", ""),
            "language": result.get("language", "en"),
            "segments": result.get("segments", []),
        }

    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise

    finally:
        try:
            if os.path.isdir(temp_dir):
                import shutil as _shutil
                _shutil.rmtree(temp_dir, ignore_errors=True)
                logger.info(f"Cleaned temp dir: {temp_dir}")
        except Exception as cleanup_err:
            logger.warning(f"Cleanup failed: {cleanup_err}")
