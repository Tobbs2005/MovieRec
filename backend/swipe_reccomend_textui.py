import pandas as pd
import numpy as np
import random
import os
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# === Load data ===
df = pd.read_csv("movies.csv")
ratings = pd.read_csv("ratings.csv")

# === Clean + prepare ===
df = df[df["overview"].notnull()].reset_index(drop=True)
df["movieId"] = df["movieId"].astype(int)

# === SBERT Embedding Cache ===
embedding_path = "movie_embeddings.npy"

if os.path.exists(embedding_path):
    print("📦 Loading cached embeddings...")
    embeddings = np.load(embedding_path)
else:
    print("🔍 Encoding overviews with SBERT...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = model.encode(df["overview"].tolist(), show_progress_bar=True)
    embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
    np.save(embedding_path, embeddings)

# === Setup ===
model = SentenceTransformer("all-MiniLM-L6-v2")  # Re-initialize in case we need semantic search
liked_indices = []
disliked_indices = []
seen_indices = set()
baseline_vector = embeddings.mean(axis=0)

# === Collaborative Filtering ===
def get_collab_score(movie_ids, min_rating=4.0):
    liked_users = ratings[
        (ratings["movieId"].isin(movie_ids)) & (ratings["rating"] >= min_rating)
    ]["userId"].unique()

    recommended = ratings[
        (ratings["userId"].isin(liked_users)) & (ratings["rating"] >= min_rating)
    ]["movieId"]

    scores = recommended.value_counts(normalize=True)
    return scores[scores > 0.01]

# === Recommendation Logic ===
def get_next_index():
    unseen = list(set(range(len(df))) - seen_indices)
    if len(liked_indices) < 3:
        return random.choice(unseen)

    liked_vecs = embeddings[liked_indices]
    dislike_vecs = embeddings[disliked_indices] if disliked_indices else None

    taste = liked_vecs.mean(axis=0)
    if dislike_vecs is not None:
        taste -= dislike_vecs.mean(axis=0)

    taste = 0.75 * taste + 0.25 * baseline_vector
    taste = taste.reshape(1, -1)

    sbert_sim = cosine_similarity(taste, embeddings)[0]

    liked_ids = df.iloc[liked_indices]["movieId"].tolist()
    collab_sim = np.zeros(len(df))
    for mid, score in get_collab_score(liked_ids).items():
        idx = df.index[df["movieId"] == mid]
        if not idx.empty:
            collab_sim[idx[0]] = score

    # Normalize
    sbert_sim = (sbert_sim - sbert_sim.min()) / (sbert_sim.max() - sbert_sim.min() + 1e-8)
    collab_sim = (collab_sim - collab_sim.min()) / (collab_sim.max() - collab_sim.min() + 1e-8)

    hybrid = 0.8 * sbert_sim + 0.2 * collab_sim
    for i in seen_indices:
        hybrid[i] = -1

    return hybrid.argmax()

# === Display Movie Info ===
def show_movie(idx):
    m = df.iloc[idx]
    print("\n🎬", m['title'])
    print("📅", m.get("release_date", "N/A"), "| 🎭", m.get("genres", "N/A"))
    print("📝", m.get("overview", "No overview")[:300] + "...")
    print("🎥 movieId:", m["movieId"])

# === Search/Seed Logic ===
query = input("🔍 Search to start with a movie? Type a title or theme, or press Enter to skip: ").strip()

if query:
    title_matches = df[df["title"].str.contains(query, case=False, na=False)]
    if not title_matches.empty:
        matched_index = title_matches.index[0]
        print(f"🎯 Matched by title: {df.iloc[matched_index]['title']}")
        query_vec = embeddings[matched_index].reshape(1, -1)
    else:
        print("🔎 No title match, doing semantic search...")
        query_vec = model.encode([query], normalize_embeddings=True)

    sim = cosine_similarity(query_vec, embeddings)[0]
    top_indices = sim.argsort()[-5:][::-1]

    print("\n🎯 Top matches:")
    for i, idx in enumerate(top_indices):
        m = df.iloc[idx]
        print(f"{i+1}. {m['title']} ({m.get('release_date', 'N/A')})")

    choice = input("\n➡️ Choose a movie to start with (1–5), or press Enter to use best match: ").strip()
    if choice.isdigit() and 1 <= int(choice) <= 5:
        current_index = top_indices[int(choice) - 1]
    else:
        current_index = top_indices[0]

    liked_indices.extend(top_indices[:5])
else:
    current_index = random.randint(0, len(df) - 1)

# === Main Loop ===
while True:
    if current_index is None or current_index in seen_indices:
        print("🎉 No more unseen movies to recommend!")
        break

    show_movie(current_index)
    seen_indices.add(current_index)

    user_input = input("\n👉 Like this movie? (Y/N/exit): ").strip().lower()
    if user_input == "exit":
        print("👋 Goodbye!")
        break
    elif user_input == "y":
        liked_indices.append(current_index)
    elif user_input == "n":
        disliked_indices.append(current_index)
    else:
        print("❗ Invalid input. Use Y, N, or exit.")
        continue

    current_index = get_next_index()
