<<<<<<< HEAD
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
=======
from typing import List, Dict, Any
import hashlib

def generate_embeddings(chunks: List[Dict[str, Any]]) -> List[List[float]]:
    """
    Generates dummy deterministic vectors for a list of chunks.
    Each vector is of size 384 (standard for small embedding models).
    Vectors are generated based on the hash of the chunk text for determinism.
    """
    embeddings = []
    vector_size = 384
    
    for chunk in chunks:
        text = chunk.get("chunk_text", "")
        # Create a deterministic seed based on text hash
        seed = int(hashlib.md5(text.encode('utf-8')).hexdigest(), 16)
        
        # Generate a dummy vector using the seed
        # We use a simple linear progression modified by the seed
        vector = []
        for i in range(vector_size):
            # Normalize to roughly -1 to 1 range
            val = ((seed + i) % 1000) / 500.0 - 1.0
            vector.append(float(val))
        
        embeddings.append(vector)
        
    return embeddings
>>>>>>> cf64b8dae460ee5f309236766e051cd25c75ae55
