import os
import logging
import tempfile
import whisper
import yt_dlp
import subprocess
from typing import Dict, List, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load Whisper model at module level
# Using 'base' for a balance between speed and accuracy
model = whisper.load_model("base")

def check_ffmpeg_installed() -> bool:
    """Checks if ffmpeg is available in the system PATH and logs results."""
    try:
        # Check ffmpeg
        ff_res = subprocess.run(['ffmpeg', '-version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if ff_res.returncode == 0:
            logger.info("FFmpeg detected successfully.")
        
        # Check ffprobe (Whisper needs both)
        fp_res = subprocess.run(['ffprobe', '-version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if fp_res.returncode == 0:
            logger.info("FFprobe detected successfully.")
            
        return True
    except FileNotFoundError:
        logger.error("FFmpeg/FFprobe NOT FOUND in system PATH. Please ensure they are installed and added to PATH.")
        return False
    except Exception as e:
        logger.error(f"Unexpected error checking FFmpeg: {str(e)}")
        return False

def transcribe(youtube_url: str) -> Dict[str, Any]:
    temp_dir = tempfile.mkdtemp()
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': os.path.join(temp_dir, 'audio.%(ext)s'),
        'quiet': True,
        'no_warnings': True,
    }

    try:
        logger.info(f"Downloading audio from: {youtube_url}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([youtube_url])
        
        # Discover what file was actually downloaded (since we don't force mp3)
        files = [f for f in os.listdir(temp_dir) if not f.endswith('.part')]
        if not files:
            raise Exception("Failed to download audio: No file created.")
        
        audio_path = os.path.join(temp_dir, files[0])
        logger.info(f"Downloaded audio to: {audio_path}")

        # Guard: Check for FFmpeg before calling Whisper
        if not check_ffmpeg_installed():
            logger.error("FFmpeg not found in system PATH. Transcription will fail.")
            raise Exception("System dependency missing: FFmpeg is required for audio transcription. Please install FFmpeg and add it to your PATH.")

        logger.info(f"Transcribing audio: {audio_path}")
        result = model.transcribe(audio_path)
        
        return {
            "full_text": result.get("text", ""),
            "language": result.get("language", "en"),
            "segments": result.get("segments", [])
        }

    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise e
    
    finally:
        # Cleanup temp directory and files
        try:
            if os.path.exists(temp_dir):
                for f in os.listdir(temp_dir):
                    os.remove(os.path.join(temp_dir, f))
                os.rmdir(temp_dir)
                logger.info(f"Cleaned up temp directory: {temp_dir}")
        except Exception as cleanup_err:
            logger.warning(f"Failed to cleanup temp directory: {str(cleanup_err)}")
