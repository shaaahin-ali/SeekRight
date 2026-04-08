import os
import sys
sys.path.insert(0, os.path.abspath('.'))
from youtube_transcript_api import YouTubeTranscriptApi
try:
    ts = YouTubeTranscriptApi.get_transcript('dQw4w9WgXcQ')
    print('SUCCESS API')
except Exception as e:
    print('ERROR API:', e)
