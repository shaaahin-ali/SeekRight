import os
import sys
sys.path.insert(0, os.path.abspath('.'))
from app.services.transcription_service import transcribe
try:
    res = transcribe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    print('SUCCESS')
except Exception as e:
    print('ERROR:', e)
