import os
import logging
import pandas as pd
import numpy as np
import requests
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from fastapi import FastAPI, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# === Load environment variables ===
load_dotenv()
TMDB_API_KEY = os.getenv("TMDB_API_KEY")

# === Setup Paths ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(BASE_DIR, "data")

movies_path = os.path.join(data_dir, "movies.csv")
ratings_path = os.path.join(data_dir, "ratings.csv")
embedding_path = os.path.join(data_dir, "movie_embeddings.npy")

# === Load Data ===
df = pd.read_csv(movies_path)
df.columns = df.columns.str.strip()
ratings = pd.read_csv(ratings_path)
ratings.columns = ratings.columns.str.strip()

# === Clean and normalize ===
df = df[df["overview"].notnull()].reset_index(drop=True)
df["movieId"] = df["movieId"].astype("Int64")

# === Embeddings ===
if os.path.exists(embedding_path):
    embeddings = np.load(embedding_path)
else:
    model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = model.encode(df["overview"].tolist(), show_progress_bar=True)
    embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
    np.save(embedding_path, embeddings)

embeddings = embeddings[:len(df)]
embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
baseline_vector = embeddings.mean(axis=0)
model = SentenceTransformer("all-MiniLM-L6-v2")

# === FastAPI Setup ===
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Pydantic Models ===
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

# === Helper to fetch TMDB poster ===
def fetch_tmdb_poster(title):
    try:
        if not TMDB_API_KEY:
            return None
        url = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_API_KEY}&query={title}"
        res = requests.get(url)
        data = res.json()
        poster = data['results'][0]['poster_path'] if data.get("results") else None
        return f"https://image.tmdb.org/t/p/w500{poster}" if poster else None
    except Exception:
        return None

# === Recommend Endpoint ===
@app.post("/recommend")
def recommend(payload: RecommendPayload):
    if not payload.user_vector and payload.liked_ids:
        vectors = [embeddings[df.index[df["movieId"] == mid][0]]
                   for mid in payload.liked_ids if not df.index[df["movieId"] == mid].empty]
        taste_vector = np.mean(vectors, axis=0) if vectors else baseline_vector
    else:
        taste_vector = np.array(payload.user_vector if payload.user_vector else baseline_vector)

    taste_vector = taste_vector / np.linalg.norm(taste_vector)
    sbert_sim = cosine_similarity([taste_vector], embeddings)[0]

    collab_sim = np.zeros(len(df))
    liked_users = ratings[(ratings["movieId"].isin(payload.liked_ids)) & (ratings["rating"] >= 4.0)]["userId"].unique()
    recommended = ratings[(ratings["userId"].isin(liked_users)) & (ratings["rating"] >= 4.0)]["movieId"]
    scores = recommended.value_counts(normalize=True)

    for mid, score in scores[scores > 0.01].items():
        idx = df.index[df["movieId"] == mid]
        if not idx.empty:
            collab_sim[idx[0]] = score

    sbert_sim = (sbert_sim - sbert_sim.min()) / (sbert_sim.max() - sbert_sim.min() + 1e-8)
    collab_sim = (collab_sim - collab_sim.min()) / (collab_sim.max() - collab_sim.min() + 1e-8)
    hybrid = 0.8 * sbert_sim + 0.2 * collab_sim

    seen_set = set(payload.seen_ids + payload.liked_ids)
    sorted_indices = np.argsort(hybrid)[::-1]

    for idx in sorted_indices:
        movie = df.loc[idx]

        if movie["movieId"] in seen_set:
            continue

        if payload.genre and payload.genre.lower() not in str(movie.get("genres", "")).lower():
            continue

        if payload.language and movie.get("original_language") != payload.language:
            continue

        if payload.adult is not None and "adult" in movie and movie["adult"] != payload.adult:
            continue

        release_date = movie.get("release_date")
        try:
            release_year = pd.to_datetime(release_date, errors="coerce").year if pd.notnull(release_date) else None
        except Exception:
            release_year = None

        if payload.year_start and (release_year is None or release_year < payload.year_start):
            continue
        if payload.year_end and (release_year is None or release_year > payload.year_end):
            continue

        poster_url = fetch_tmdb_poster(movie.get("title"))
        return {
            "movie": {
                "title": movie.get("title", "Untitled"),
                "overview": movie.get("overview", "No overview."),
                "genres": movie.get("genres", "N/A"),
                "release_date": movie.get("release_date", "N/A"),
                "poster_path": poster_url,
                "movieId": int(movie.get("movieId"))
            },
            "user_vector": taste_vector.tolist()
        }

    return {"error": "No more unseen movies matching the filters."}

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
        results = results[results["adult"] == adult]

    top_matches = results.head(5).to_dict(orient="records") if not results.empty else []
    return {
        "movies": [
            {
                "title": m.get("title", "Untitled"),
                "overview": m.get("overview", "No overview."),
                "genres": m.get("genres", "N/A"),
                "release_date": m.get("release_date", "N/A"),
                "poster_path": fetch_tmdb_poster(m.get("title")),
                "movieId": int(m["movieId"]),
            }
            for m in top_matches
        ]
    }

# === Feedback Endpoint ===
@app.post("/feedback")
async def feedback(payload: FeedbackPayload, request: Request):
    try:
        vec = np.array(payload.user_vector) if payload.user_vector else baseline_vector
        idx = df.index[df["movieId"] == payload.movie_id]
        if idx.empty:
            return {"error": "Invalid movie ID."}

        movie_vec = embeddings[idx[0]]
        alpha = 0.7
        if payload.feedback == "like":
            new_vec = (1 - alpha) * vec + alpha * movie_vec
        elif payload.feedback == "dislike":
            new_vec = (1 + alpha) * vec - alpha * movie_vec
        else:
            return {"error": "Invalid feedback type."}

        new_vec = new_vec / np.linalg.norm(new_vec)
        return {"user_vector": new_vec.tolist()}
    except Exception as e:
        print("❌ Feedback endpoint error:", str(e))
        return {"error": "Exception occurred while processing feedback."}
