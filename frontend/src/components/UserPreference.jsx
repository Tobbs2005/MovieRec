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
  const [language, setLanguage] = useState('');
  const [yearStart, setYearStart] = useState('');
  const [yearEnd, setYearEnd] = useState('');
  const [adult, setAdult] = useState(false);
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
        body: JSON.stringify({
          query,
          genre,
          language,
          year_start: yearStart ? parseInt(yearStart) : undefined,
          year_end: yearEnd ? parseInt(yearEnd) : undefined,
          adult
        })
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
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search a movie by title, description, or genre..."
        style={{
          border: '1px solid #ccc',
          padding: '10px',
          borderRadius: '8px',
          width: '100%',
          marginBottom: '10px'
        }}
      />
      <input
        list="genre-list"
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
        placeholder="Filter by genre (optional)"
        style={{
          border: '1px solid #ccc',
          padding: '10px',
          borderRadius: '8px',
          width: '100%',
          marginBottom: '10px'
        }}
      />
      <datalist id="genre-list">
        {GENRES.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>

      <input
        type="text"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        placeholder="Language (e.g. en, fr, zh)"
        style={{
          border: '1px solid #ccc',
          padding: '10px',
          borderRadius: '8px',
          width: '100%',
          marginBottom: '10px'
        }}
      />

      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <input
          type="number"
          placeholder="Start year"
          value={yearStart}
          onChange={(e) => setYearStart(e.target.value)}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <input
          type="number"
          placeholder="End year"
          value={yearEnd}
          onChange={(e) => setYearEnd(e.target.value)}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <input
          type="checkbox"
          checked={adult}
          onChange={(e) => setAdult(e.target.checked)}
        />
        Include adult content
      </label>

      <button
        onClick={handleSearch}
        style={{
          padding: '10px 16px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '9999px',
          fontWeight: 'bold',
          width: '100%',
          marginBottom: '24px',
          cursor: 'pointer'
        }}
      >
        🔍 Search
      </button>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {searchResults.length > 0 && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
            ✨ Found Movies (click to like)
          </h2>
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
            style={{
              marginTop: '20px',
              padding: '10px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '9999px',
              fontWeight: 'bold',
              width: '100%',
              cursor: 'pointer'
            }}
          >
            🚀 Start Swiping
          </button>
        </div>
      )}
    </div>
  );
}