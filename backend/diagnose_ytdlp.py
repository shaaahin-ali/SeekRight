import yt_dlp
import subprocess
import sys
import os

def check():
    print("--- Diagnostic Report ---")
    
    # 1. Python Import
    try:
        import yt_dlp
        print(f"✅ Python 'yt_dlp' module: {yt_dlp.version.__version__}")
    except Exception as e:
        print(f"❌ Python 'yt_dlp' module import failed: {e}")

    # 2. yt-dlp CLI
    try:
        # Try to find yt-dlp in the same directory as python.exe
        python_dir = os.path.dirname(sys.executable)
        ytdlp_path = os.path.join(python_dir, "yt-dlp.exe")
        if os.path.exists(ytdlp_path):
            res = subprocess.run([ytdlp_path, "--version"], capture_output=True, text=True)
            print(f"✅ yt-dlp CLI found at venv: {res.stdout.strip()}")
        else:
            print(f"❌ yt-dlp.exe NOT found in {python_dir}")
    except Exception as e:
        print(f"❌ yt-dlp CLI check failed: {e}")

    # 3. FFmpeg CLI
    try:
        res = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True)
        print(f"✅ ffmpeg CLI: {res.stdout.splitlines()[0]}")
    except Exception as e:
        print(f"❌ ffmpeg CLI NOT found: {e}")

    # 4. yt-dlp + ffmpeg integration
    try:
        ydl_opts = {'quiet': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # yt-dlp checks for ffmpeg when initializing if certain opts are set, 
            # but let's check its internal post-processor check
            from yt_dlp.postprocessor.ffmpeg import FFmpegPostProcessor
            pp = FFmpegPostProcessor()
            print(f"✅ yt-dlp ffmpeg path: {pp.get_versions()}")
    except Exception as e:
        print(f"❌ yt-dlp ffmpeg integration failed: {e}")

if __name__ == "__main__":
    check()
