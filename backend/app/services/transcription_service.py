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
    """Checks if ffmpeg is available in the system PATH or common installation locations."""
    # 1. Check if it's already in the PATH
    try:
        subprocess.run(['ffmpeg', '-version'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except (FileNotFoundError, subprocess.SubprocessError):
        pass

    # 2. Check common installation paths on Windows
    common_paths = [
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "WinGet", "Packages", "Gyan.FFmpeg_Microsoft.Winget.Source_8.0.1", "ffmpeg-8.0.1-full_build", "bin", "ffmpeg.exe"),
    ]
    
    # Also check the user's Downloads folder if we saw it there earlier
    user_profile = os.environ.get("USERPROFILE", "")
    if user_profile:
        # We'll search for any ffmpeg.exe in the Downloads folder (shallow search)
        downloads_path = os.path.join(user_profile, "Downloads")
        if os.path.exists(downloads_path):
            for root, dirs, files in os.walk(downloads_path):
                if "ffmpeg.exe" in files:
                    ffmpeg_path = os.path.join(root, "ffmpeg.exe")
                    # Add this to the current process PATH
                    bin_dir = os.path.dirname(ffmpeg_path)
                    os.environ["PATH"] = bin_dir + os.pathsep + os.environ["PATH"]
                    logger.info(f"Found FFmpeg in downloads and added to PATH: {ffmpeg_path}")
                    return True
                # Limit search depth for performance
                if root.count(os.sep) - downloads_path.count(os.sep) >= 2:
                    del dirs[:]

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
