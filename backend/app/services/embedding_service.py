import httpx
import os
import time
import logging

logger = logging.getLogger(__name__)

HF_TOKEN = os.getenv("HF_TOKEN", "") # Use token if provided, otherwise it operates unauthenticated via free Hugging Face API rate limits
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
API_URL = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{MODEL_NAME}"
EXPECTED_DIMENSION = 384

def _call_hf_api(payload):
    headers = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}
    for attempt in range(3):
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(API_URL, headers=headers, json=payload)
            if response.status_code == 200:
                return response.json()
            # If the model is currently loading on HF servers
            if 'estimated_time' in response.text:
                time.sleep(min(response.json().get('estimated_time', 20), 20))
                continue
            response.raise_for_status()
        except Exception as e:
            if attempt == 2:
                logger.error(f"HF API Error: {str(e)}")
                raise

def get_dimension():
    return EXPECTED_DIMENSION

def embed_texts(texts):
    if not texts:
        return []
    embeddings = _call_hf_api({"inputs": texts})
    return embeddings

def embed_query(query):
    embeddings = _call_hf_api({"inputs": [query]})
    return embeddings[0]

def embed_and_store(transcript):
    pass