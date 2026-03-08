import subprocess
import whisper
import os

def test():
    print("--- Debugging FFmpeg and Whisper ---")
    
    # 1. Test subprocess.run('ffmpeg')
    try:
        res = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True)
        print(f"ffmpeg -version: SUCCESS (Code {res.returncode})")
    except Exception as e:
        print(f"ffmpeg -version: FAILED. Error: {e}")

    # 1b. Test subprocess.run('ffprobe')
    try:
        res = subprocess.run(['ffprobe', '-version'], capture_output=True, text=True)
        print(f"ffprobe -version: SUCCESS (Code {res.returncode})")
    except Exception as e:
        print(f"ffprobe -version: FAILED. Error: {e}")

    # 2. Test where ffmpeg is
    try:
        res = subprocess.run(['where', 'ffmpeg'], capture_output=True, text=True)
        print(f"where ffmpeg:\n{res.stdout}")
    except Exception as e:
        print(f"where ffmpeg: FAILED. Error: {e}")

    # 3. Test whisper internal ffmpeg check
    try:
        # Generate a 1-second silent wav file
        dummy_audio = "silence.wav"
        print("Generating dummy audio...")
        subprocess.run(['ffmpeg', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=16000:cl=mono', '-t', '1', dummy_audio], capture_output=True)
        
        print("Loading Whisper 'tiny' model...")
        model = whisper.load_model("tiny")
        print("Transcribing dummy audio...")
        result = model.transcribe(dummy_audio)
        print(f"Transcription SUCCESS: {result['text']}")
        
        # Cleanup
        if os.path.exists(dummy_audio):
            os.remove(dummy_audio)
    except Exception as e:
        print(f"Whisper Transcription: FAILED. Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test()
