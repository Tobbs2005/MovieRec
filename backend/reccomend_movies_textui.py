import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Load the movie data and SBERT embeddings
df = pd.read_csv("enriched_movies.csv")
embeddings = np.load("movie_embeddings.npy")

# Load the same model you used for embedding
model = SentenceTransformer("all-MiniLM-L6-v2")

print("🎬 Movie Recommender Ready!")
print("Describe the type of movie you want (type 'exit' to quit).")

while True:
    query = input("\n📝 Your description: ")
    if query.lower() == "exit":
        break

    # Embed the user query
    query_embedding = model.encode([query], normalize_embeddings=True)

    # Compute similarity to all movie embeddings
    similarities = cosine_similarity(query_embedding, embeddings)[0]

    # Get top 5 most similar movie indices
    top_indices = similarities.argsort()[::-1][:5]

    print("\n🎯 Top Matches:")
    for i in top_indices:
        movie = df.iloc[i]
        print(f"\n🎞️ {movie['title']} ({int(movie['year'])}) — Rating: {movie['rating']}")
        print(f"🧠 Genre: {movie['genre']}")
        print(f"📝 {movie['overview'][:200]}...")
        print(f"🖼️ Poster: {movie['poster_url']}")
