from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
EXPECTED_DIMENSION = 384

import gc

MODEL_NAME = "all-MiniLM-L6-v2"
EXPECTED_DIMENSION = 384

def get_dimension():
    # Lazy load just to check dimension (cache this ideally, but doing it safely)
    model = SentenceTransformer(MODEL_NAME)
    dim = model.get_sentence_embedding_dimension()
    del model
    gc.collect()
    return dim

def embed_texts(texts):
    model = SentenceTransformer(MODEL_NAME)
    res = model.encode(texts)
    del model
    gc.collect()
    return res

def embed_query(query):
    model = SentenceTransformer(MODEL_NAME)
    res = model.encode([query])[0]
    del model
    gc.collect()
    return res

def embed_and_store(transcript):
    # Dummy placeholder for embed_and_store phase
    pass