from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
EXPECTED_DIMENSION = 384

model = SentenceTransformer(MODEL_NAME)

def get_dimension():
    return model.get_sentence_embedding_dimension()

assert get_dimension() == EXPECTED_DIMENSION, \
    f"Model dimension mismatch! Expected {EXPECTED_DIMENSION}, got {get_dimension()}"

def embed_texts(texts):
    return model.encode(texts)

def embed_query(query):
    return model.encode([query])[0]