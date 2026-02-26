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
