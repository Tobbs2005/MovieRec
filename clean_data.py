import pandas as pd

# Load the IMDb Top 1000 dataset
df = pd.read_csv("imdb_top_1000.csv")

# Keep only the columns we care about
df = df[[
    "Series_Title",       # Movie title
    "Overview",           # Plot summary
    "Poster_Link",        # Poster image URL
    "Released_Year",      # Year
    "Genre",              # Genre tags
    "IMDB_Rating"         # IMDb rating
]]

# Clean up: drop rows with missing overview
df = df.dropna(subset=["Overview"])

# Rename columns for consistency
df = df.rename(columns={
    "Series_Title": "title",
    "Poster_Link": "poster_url",
    "Overview": "overview",
    "Released_Year": "year",
    "Genre": "genre",
    "IMDB_Rating": "rating"
})

# Save to a new file ready for embedding
df.to_csv("enriched_movies.csv", index=False)

print("✅ enriched_movies.csv is ready to embed!")
