import { useState } from 'react';
import MovieCard from './MovieCard';
import style from './SearchBar.module.css';

export default function SearchBar({ onStart }) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [likedIds, setLikedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
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
    <div className={style.container}>
      <div className={style.searchBarRow}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a movie by title, description, or genre..."
          className={style.input}
        />
        <button onClick={handleSearch} className={style.searchButton}>
          🔍 Search
        </button>
      </div>
      {
        (searchResults.length == 0) && 
        <div className={style.instructions}>
          <p>
            Search for your liked movies! Or start swiping immediately...
          </p>
        </div>
      }
      <button
        onClick={() => onStart(likedIds)}
        className={style.startButton}
      >
        🚀 Start Swiping
      </button>

      {loading && <p>Loading...</p>}
      {error && <p className={style.error}>{error}</p>}

      {searchResults.length > 0 && (
        <div>
          <h2 className={style.resultsTitle}>✨ Found Movies (click to like)</h2>
          {searchResults.map((movie) => (
            <MovieCard
              key={movie.movieId}
              movie={movie}
              liked={likedIds.includes(movie.movieId)}
              onClick={() => toggleLike(movie.movieId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}