/**
 * UserPreference.jsx
 * Handles search input, genre selection, and pre-liking movies.
 */

import { useState } from 'react';
import MovieCard from './MovieCard';

const GENRES = [
  "Action", "Adventure", "Animation", "Children", "Comedy", "Crime",
  "Documentary", "Drama", "Fantasy", "Film-Noir", "Horror", "Musical",
  "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western"
];

export default function UserPreference({ onStart }) {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [likedIds, setLikedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query.trim() && !genre.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, genre })
      });
      const data = await res.json();
      if (!data.error) {
        setSearchResults(Array.isArray(data.movies) ? data.movies.slice(0, 5) : []);
      } else {
        setError(data.error);
        setSearchResults([]);
      }
    } catch (err) {
      setError('Search failed.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = (movieId) => {
    setLikedIds((prev) =>
      prev.includes(movieId) ? prev.filter((id) => id !== movieId) : [...prev, movieId]
    );
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search a movie by description..."
        className="border px-3 py-2 rounded w-full mb-2"
      />
      <input
        list="genre-list"
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
        placeholder="Filter by genre (optional)"
        className="border px-3 py-2 rounded w-full mb-2"
      />
      <datalist id="genre-list">
        {GENRES.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>
      <button
        onClick={handleSearch}
        className="px-4 py-2 bg-blue-200 hover:bg-blue-300 rounded-full font-semibold w-full mb-4"
      >
        🔍 Search
      </button>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {searchResults.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">✨ Found Movies (click to like)</h2>
          {searchResults.map((movie) => (
            <MovieCard
              key={movie.movieId}
              movie={movie}
              liked={likedIds.includes(movie.movieId)}
              onClick={() => toggleLike(movie.movieId)}
            />
          ))}
          <button
            onClick={() => onStart(likedIds)}
            className="mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold w-full"
          >
            🚀 Start Swiping
          </button>
        </div>
      )}
    </div>
  );
}