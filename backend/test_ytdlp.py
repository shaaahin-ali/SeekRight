import yt_dlp
import os
import tempfile

def test_ytdlp():
    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" # Standard test URL
    temp_dir = tempfile.mkdtemp()
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': os.path.join(temp_dir, 'audio.%(ext)s'),
        'quiet': True,
        'no_warnings': True,
    }
    
    print(f"Testing yt-dlp with URL: {url}")
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # We don't want to download the whole thing, just test if it can extract info
            info = ydl.extract_info(url, download=False)
            print(f"✅ yt-dlp successfully extracted info for: {info.get('title')}")
            return True
    except Exception as e:
        print(f"❌ yt-dlp test failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_ytdlp()
