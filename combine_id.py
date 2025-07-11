import pandas as pd
import re

# === Load files ===
enriched = pd.read_csv("enriched_movies.csv")       # Your enriched dataset (no movieId)
movies = pd.read_csv("movies.csv")                  # MovieLens movies metadata (with movieId)

# === Clean the 'year' column in enriched ===

# Convert 'year' to numeric (non-numeric entries like 'PG' become NaN)
enriched["year"] = pd.to_numeric(enriched["year"], errors="coerce")

# Drop rows where year is missing or invalid
enriched = enriched.dropna(subset=["year"])
enriched["year"] = enriched["year"].astype(int)

# === Extract and clean year from MovieLens titles ===
movies["year"] = movies["title"].str.extract(r"\((\d{4})\)")
movies = movies.dropna(subset=["year"])
movies["year"] = movies["year"].astype(int)

# === Clean movie titles (remove year, trim spaces) ===
movies["clean_title"] = movies["title"].str.replace(r"\(\d{4}\)", "", regex=True).str.strip()
enriched["clean_title"] = enriched["title"].str.strip()

# === Merge datasets on clean_title and year ===
merged = enriched.merge(
    movies[["movieId", "clean_title", "year"]],
    on=["clean_title", "year"],
    how="left"
)

# === Report success rate ===
matched = merged["movieId"].notnull().sum()
total = len(merged)
print(f"✅ Matched {matched} of {total} movies ({matched/total:.2%})")

# === Save merged result ===
merged.to_csv("enriched_with_ids.csv", index=False)
print("📁 Saved merged dataset as enriched_with_ids.csv")
