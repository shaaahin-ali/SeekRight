import faiss
import numpy as np
from app.services.embedding_service import embed_texts, embed_query, EXPECTED_DIMENSION

def build_faiss_index(chunks):
    embeddings = embed_texts(chunks)
    dimension = EXPECTED_DIMENSION

    # Structural Safeguard: Verify embedding shape against expectation
    if embeddings.shape[1] != dimension:
        raise ValueError(f"Embedding dimension {embeddings.shape[1]} mismatch with expected {dimension}")

    index = faiss.IndexFlatL2(dimension)
    index.add(np.array(embeddings))

    return index, embeddings

def search(index, query_vector, top_k=5, threshold=1.5):
    """
    Search FAISS index and filter strictly by distance threshold.
    Validates dimensional matching explicitly.
    """
    if len(query_vector) != index.d:
        raise ValueError(f"Dimensional mismatch: index has {index.d}, query has {len(query_vector)}")
        
    D, I = index.search(np.array([query_vector]), top_k)
    
    valid_indices = []
    top_distance = float('inf')
    if len(D[0]) > 0:
        top_distance = D[0][0]
        
    for dist, idx in zip(D[0], I[0]):
        # Distance interpretation: Lower L2 = more similar
        if dist <= threshold and idx != -1:
            valid_indices.append((dist, idx))
            
    return valid_indices, top_distance
