import os
import logging
import tempfile
import whisper
import yt_dlp
import subprocess
from pathlib import Path
from typing import Dict, List, Any
import urllib.parse
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter

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

def _build_ydl_opts(temp_dir: str) -> dict:
    """Build yt-dlp options, injecting cookie auth if available."""
    base_opts = {
        'format': 'bestaudio/best',
        'outtmpl': os.path.join(temp_dir, 'audio.%(ext)s'),
        'quiet': True,
        'no_warnings': True,
        # Spoof a real browser user-agent to reduce bot flags
        'http_headers': {
            'User-Agent': (
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/124.0.0.0 Safari/537.36'
            )
        },
    }

    # 1. Try a cookies.txt file placed next to this service file
    cookies_file = Path(__file__).parent / 'cookies.txt'
    if cookies_file.exists():
        logger.info(f"Using cookies file: {cookies_file}")
        base_opts['cookiefile'] = str(cookies_file)
        return base_opts

    # 2. Try extracting cookies from installed browsers (in priority order)
    for browser in ('chrome', 'edge', 'firefox', 'opera', 'brave', 'vivaldi'):
        try:
            test_opts = dict(base_opts)
            test_opts['cookiesfrombrowser'] = (browser,)
            # Quick probe — raises if the browser profile isn't accessible
            with yt_dlp.YoutubeDL(test_opts) as probe:
                probe.cookiejar  # access the jar to trigger loading
            logger.info(f"Using cookies from browser: {browser}")
            base_opts['cookiesfrombrowser'] = (browser,)
            return base_opts
        except Exception:
            continue

    logger.warning(
        "No browser cookies found and no cookies.txt present. "
        "YouTube may block the download. Place a cookies.txt in "
        "app/services/ to fix this."
    )
    return base_opts


def extract_video_id(youtube_url: str) -> str:
    """Extract YouTube video ID from URL."""
    try:
        parsed = urllib.parse.urlparse(youtube_url)
        if parsed.hostname == 'youtu.be':
            return parsed.path[1:]
        if parsed.hostname in ('www.youtube.com', 'youtube.com'):
            if parsed.path == '/watch':
                query = urllib.parse.parse_qs(parsed.query)
                return query['v'][0]
            if parsed.path.startswith('/embed/'):
                return parsed.path.split('/')[2]
            if parsed.path.startswith('/v/'):
                return parsed.path.split('/')[2]
    except Exception:
        pass
    return ""

def transcribe(youtube_url: str) -> Dict[str, Any]:
    # Tier 1: Try youtube_transcript_api
    video_id = extract_video_id(youtube_url)
    if video_id:
        try:
            logger.info(f"Attempting to fetch transcript for video ID: {video_id} using YouTube API.")
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            
            # Formatter simply joins the text
            formatter = TextFormatter()
            full_text = formatter.format_transcript(transcript_list)
            
            # Map elements back to segments for consistency
            segments = []
            for item in transcript_list:
                segments.append({
                    "start": item["start"],
                    "end": item["start"] + item["duration"],
                    "text": item["text"]
                })
            
            logger.info("Successfully fetched transcript via YouTube API.")
            return {
                "full_text": full_text,
                "language": "en", # youtube_transcript_api can return languages but we'll default
                "segments": segments
            }
        except Exception as e:
            logger.warning(f"YouTubeTranscriptApi failed: {e}. Falling back to yt-dlp + whisper.")
    else:
        logger.warning(f"Could not extract video ID from {youtube_url}. Proceeding to yt-dlp.")

    # Tier 2: Fallback to yt-dlp + whisper
    temp_dir = tempfile.mkdtemp()
    ydl_opts = _build_ydl_opts(temp_dir)

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
