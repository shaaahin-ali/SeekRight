import yt_dlp
import subprocess
import sys
import os
import logging

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def verify_environment():
    print("\n" + "="*50)
    print("   SEEKRIGHT ENVIRONMENT VERIFICATION   ")
    print("="*50 + "\n")

    # 1. Virtual Environment Check
    in_venv = sys.prefix != sys.base_prefix
    if in_venv:
        logger.info(f"✅ Running in virtual environment: {sys.prefix}")
    else:
        logger.warning("⚠️ NOT running in a virtual environment. This might cause dependency issues.")

    # 2. Python Version
    logger.info(f"✅ Python version: {sys.version.split()[0]}")

    # 3. yt-dlp Check
    try:
        import yt_dlp
        logger.info(f"✅ yt-dlp module: {yt_dlp.version.__version__}")
    except ImportError:
        logger.error("❌ yt-dlp is NOT installed. Run: pip install yt-dlp")

    # 4. FFmpeg Check
    try:
        res = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True, check=False)
        if res.returncode == 0:
            logger.info(f"✅ ffmpeg CLI: {res.stdout.splitlines()[0]}")
        else:
            logger.warning("⚠️ ffmpeg CLI found but produced an error. Check your installation.")
    except FileNotFoundError:
        logger.error("❌ ffmpeg CLI NOT found. Ensure FFmpeg is installed and in your PATH.")
        
        # Check common Windows paths as a helper
        common_paths = [r"C:\ffmpeg\bin", r"C:\Program Files\ffmpeg\bin"]
        for p in common_paths:
            if os.path.exists(os.path.join(p, "ffmpeg.exe")):
                logger.info(f"💡 Suggestion: Found ffmpeg at {p}. Add this to your PATH.")

    # 5. Whisper Check
    try:
        import whisper
        logger.info("✅ whisper module: installed")
    except ImportError:
        logger.error("❌ whisper is NOT installed. Run: pip install openai-whisper")

    print("\n" + "="*50)
    print("   Verification Complete")
    print("="*50 + "\n")

if __name__ == "__main__":
    verify_environment()
