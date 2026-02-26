from sentence_transformers import SentenceTransformer

# MODEL IMMUTABILITY RULE
# Embedding model version must never change silently.
# If changed later, full re-index of chunks will be required.
MODEL_NAME = "all-MiniLM-L6-v2"
EXPECTED_DIMENSION = 384 # Hardcoded for all-MiniLM-L6-v2

model = SentenceTransformer(MODEL_NAME)

# RUNTIME DIMENSION ASSERTION
# This ensures that any accidental model swap or upgrade that changes 
# output shape is caught immediately rather than causing FAISS crashes.
def get_dimension():
    return model.get_sentence_embedding_dimension()

assert get_dimension() == EXPECTED_DIMENSION, f"Model dimension mismatch! Expected {EXPECTED_DIMENSION}, got {get_dimension()}"

# EMBEDDING REGENERATION POLICY
# If the MODEL_NAME is changed or the EXPECTED_DIMENSION is updated, 
# all existing rows in the TRANSCRIPT_CHUNKS table MUST be deleted 
# to trigger lazy re-generation of embeddings during the next query.
# Failure to do so will result in dimensional mismatch errors or 
# corrupted semantic retrieval results.

def embed_texts(texts):
    return model.encode(texts)

def embed_query(query):
    return model.encode([query])[0]
