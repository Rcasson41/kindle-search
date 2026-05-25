import json
import numpy as np
from sentence_transformers import SentenceTransformer

_model = None


def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def embed(text: str) -> list[float]:
    model = get_model()
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()


def cosine_similarity(a: list[float], b: list[float]) -> float:
    va = np.array(a)
    vb = np.array(b)
    denom = np.linalg.norm(va) * np.linalg.norm(vb)
    if denom == 0:
        return 0.0
    return float(np.dot(va, vb) / denom)


def rank_by_similarity(query_embedding: list[float], books_with_embeddings: list) -> list:
    scored = []
    for book, embedding in books_with_embeddings:
        if embedding:
            score = cosine_similarity(query_embedding, embedding)
            scored.append((book, score))
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored
