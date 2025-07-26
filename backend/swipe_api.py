import os
import numpy as np
import pandas as pd
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from sentence_transformers import SentenceTransformer
import faiss
import random

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

# === Load Embeddings ===
model = SentenceTransformer("all-MiniLM-L6-v2")
embeddings = np.load(EMBEDDING_PATH)
embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)

# === Build FAISS Index ===
index = faiss.IndexFlatIP(embeddings.shape[1])
index.add(embeddings)

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
    seen_set = set(payload.seen_ids + payload.liked_ids)

    # Onboarding mode: < 5 liked movies
    # Onboarding mode: < 5 liked movies
    if len(payload.liked_ids) < 5:
        top_voted = df.sort_values(by="vote_count", ascending=False).head(100)
        sampled = top_voted.sample(n=min(30, len(top_voted)), random_state=random.randint(0, 9999))

        for _, movie in sampled.iterrows():
            if movie['id'] not in seen_set:
                return {
                    "movie": {
                        "movieId": int(movie["id"]),
                        "title": movie["title"],
                        "genres": movie["genres"],
                        "overview": movie["overview"],
                        "release_date": movie["release_date"],
                        "poster_path": "https://image.tmdb.org/t/p/w185" + movie.get("poster_path", ""),
                    },
                    "user_vector": None
                }
        return {"error": "No onboarding movies left"}

    # Normal mode: >= 10 liked movies
    vectors = [embeddings[idx] for mid in payload.liked_ids for idx in df.index[df["id"] == mid]]
    taste_vector = np.mean(vectors, axis=0)
    taste_vector = taste_vector / np.linalg.norm(taste_vector)
    similarity_scores = np.dot(embeddings, taste_vector)

    # Apply soft penalty for disliked movies
    disliked_ids = list(set(payload.seen_ids) - set(payload.liked_ids))
    penalty_weight = 0.1
    for mid in disliked_ids:
        idx = df.index[df["id"] == mid]
        if not idx.empty:
            disliked_vec = embeddings[idx[0]]
            sims = np.dot(embeddings, disliked_vec)
            similarity_scores -= penalty_weight * sims

    sorted_indices = np.argsort(similarity_scores)[::-1]
    genre_counts = {}

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

        movie_genres = movie["genres"].lower().split(',')
        primary_genre = movie_genres[0].strip() if movie_genres else None
        if primary_genre:
            genre_counts[primary_genre] = genre_counts.get(primary_genre, 0) + 1
            if genre_counts[primary_genre] > 5:
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
def feedback(_: FeedbackPayload):
    return {"user_vector": None}  # now stateless

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

    # --- Keyword Search ---
    results = df[
        df["title"].str.lower().str.contains(query_lower) |
        df["overview"].str.lower().str.contains(query_lower) |
        df["genres"].astype(str).str.lower().str.contains(query_lower)
    ]

    # --- Zero-shot Semantic Search ---
    query_embedding = model.encode(query, normalize_embeddings=True)
    scores = np.dot(embeddings, query_embedding)
    top_semantic_indices = np.argsort(scores)[::-1][:10]
    semantic_results = df.iloc[top_semantic_indices]

    # --- Combine Results ---
    combined = pd.concat([results, semantic_results]).drop_duplicates(subset="id")

    # --- Apply Filters ---
    if genre_lower:
        combined = combined[combined["genres"].astype(str).str.lower().str.contains(genre_lower)]
    if language:
        combined = combined[combined["original_language"].astype(str) == language]
    if year_start or year_end:
        combined = combined[combined["release_date"].notnull()]
        combined["release_year"] = pd.to_datetime(combined["release_date"], errors='coerce').dt.year
        if year_start:
            combined = combined[combined["release_year"] >= year_start]
        if year_end:
            combined = combined[combined["release_year"] <= year_end]
    if "adult" in combined.columns and adult is not None:
        if not adult:
            combined = combined[combined["adult"] == adult]

    top_matches = combined.head(5).to_dict(orient="records") if not combined.empty else []
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