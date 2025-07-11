import pandas as pd
from sentence_transformers import SentenceTransformer
import numpy as np

# Load enriched movie data
df = pd.read_csv("enriched_movies.csv")

# Load SBERT model (this one is fast & good quality)
model = SentenceTransformer("all-MiniLM-L6-v2")

# Extract movie overviews
overviews = df["overview"].tolist()

# Embed them using SBERT
print("🔍 Embedding movie overviews...")
embeddings = model.encode(overviews, show_progress_bar=True, normalize_embeddings=True)

# Save embeddings to a .npy file for reuse
np.save("movie_embeddings.npy", embeddings)

print("✅ Saved embeddings to movie_embeddings.npy")