import os
import numpy as np
import pandas as pd
from fastapi import FastAPI, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# === Paths ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "TMDB_movie_dataset_v11.csv")
EMBEDDING_PATH = os.path.join(BASE_DIR, "data", "movie_embeddings_v11.npy")

# === Load & Prepare Data ===
df = pd.read_csv(DATA_PATH)
df.fillna('', inplace=True)

# Combine metadata fields into a single text input for embedding
df['metadata'] = (
    df['genres'] + ' ' +
    df['keywords'] + ' ' +
    df['original_language'] + ' ' +
    df['production_companies'] + ' ' +
    df['spoken_languages']
).str.lower()

# === Load or Generate Embeddings ===
model = SentenceTransformer("all-MiniLM-L6-v2")

if os.path.exists(EMBEDDING_PATH):
    embeddings = np.load(EMBEDDING_PATH)
else:
    embeddings = model.encode(df['metadata'].tolist(), show_progress_bar=True)
    embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
    np.save(EMBEDDING_PATH, embeddings)

# === FastAPI Setup ===
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Request Models ===
class RecommendPayload(BaseModel):
    user_vector: Optional[list] = None
    seen_ids: list[int]
    liked_ids: list[int]
    genre: Optional[str] = None
    language: Optional[str] = None
    year_start: Optional[int] = None
    year_end: Optional[int] = None
    adult: Optional[bool] = None

class FeedbackPayload(BaseModel):
    user_vector: Optional[list] = None
    movie_id: int
    feedback: str

# === Recommendation Endpoint ===
@app.post("/recommend")
def recommend(payload: RecommendPayload):
    if not payload.user_vector and payload.liked_ids:
        vectors = [embeddings[idx] for mid in payload.liked_ids for idx in df.index[df["id"] == mid]]
        taste_vector = np.mean(vectors, axis=0) if vectors else embeddings.mean(axis=0)
    else:
        taste_vector = np.array(payload.user_vector if payload.user_vector else embeddings.mean(axis=0))

    taste_vector = taste_vector / np.linalg.norm(taste_vector)
    similarity_scores = cosine_similarity([taste_vector], embeddings)[0]

    seen_set = set(payload.seen_ids + payload.liked_ids)
    sorted_indices = np.argsort(similarity_scores)[::-1]

    for idx in sorted_indices:
        movie = df.iloc[idx]
        if movie["id"] in seen_set:
            continue

        if payload.genre and payload.genre.lower() not in movie["genres"].lower():
            continue
        if payload.language and movie["original_language"] != payload.language:
            continue
        if payload.adult is not None and bool(movie.get("adult", False)) != payload.adult:
            continue

        try:
            year = pd.to_datetime(movie["release_date"], errors="coerce").year
        except:
            year = None

        if payload.year_start and (year is None or year < payload.year_start):
            continue
        if payload.year_end and (year is None or year > payload.year_end):
            continue

        return {
            "movie": {
                "movieId": int(movie["id"]),
                "title": movie["title"],
                "genres": movie["genres"],
                "overview": movie["overview"],
                "release_date": movie["release_date"],
                "poster_path": "https://image.tmdb.org/t/p/w185" + movie.get("poster_path", ""),
            },
            "user_vector": taste_vector.tolist()
        }

    return {"error": "No more unseen movies matching the filters."}

# === Feedback Endpoint ===
@app.post("/feedback")
def feedback(payload: FeedbackPayload):
    vec = np.array(payload.user_vector if payload.user_vector else embeddings.mean(axis=0))
    idx = df.index[df["id"] == payload.movie_id]
    if idx.empty:
        return {"error": "Movie not found"}

    movie_vec = embeddings[idx[0]]
    alpha = 0.7

    if payload.feedback == "like":
        updated = (1 - alpha) * vec + alpha * movie_vec
    elif payload.feedback == "dislike":
        updated = (1 + alpha) * vec - alpha * movie_vec
    else:
        return {"error": "Invalid feedback type"}

    updated = updated / np.linalg.norm(updated)
    return {"user_vector": updated.tolist()}

# === Search Endpoint ===
@app.post("/search")
def hybrid_search(
    query: str = Body(..., embed=True),
    genre: Optional[str] = Body(None, embed=True),
    language: Optional[str] = Body(None, embed=True),
    year_start: Optional[int] = Body(None, embed=True),
    year_end: Optional[int] = Body(None, embed=True),
    adult: Optional[bool] = Body(None, embed=True)
):
    query_lower = query.lower()
    genre_lower = genre.lower() if genre else None

    results = df[
        df["title"].str.lower().str.contains(query_lower) |
        df["overview"].str.lower().str.contains(query_lower) |
        df["genres"].astype(str).str.lower().str.contains(query_lower)
    ]

    if genre_lower:
        results = results[results["genres"].astype(str).str.lower().str.contains(genre_lower)]
    if language:
        results = results[results["original_language"].astype(str) == language]
    if year_start or year_end:
        results = results[results["release_date"].notnull()]
        results["release_year"] = pd.to_datetime(results["release_date"], errors='coerce').dt.year
        if year_start:
            results = results[results["release_year"] >= year_start]
        if year_end:
            results = results[results["release_year"] <= year_end]
    if "adult" in results.columns and adult is not None:
        # Non adult content
        if (not adult):
          results = results[results["adult"] == adult]

    top_matches = results.head(5).to_dict(orient="records") if not results.empty else []
    return {
        "movies": [
            {
                "title": m.get("title", "Untitled"),
                "overview": m.get("overview", "No overview."),
                "genres": m.get("genres", "N/A"),
                "release_date": m.get("release_date", "N/A"),
                "poster_path": "https://image.tmdb.org/t/p/w185" + m.get("poster_path", ""),
                "movieId": int(m["id"]),
            }
            for m in top_matches
        ]
    }
