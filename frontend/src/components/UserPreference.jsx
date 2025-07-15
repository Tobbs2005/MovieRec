import { useState } from 'react';
import MovieCard from './MovieCard';
import style from './UserPreference.module.css';


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
  <div className={style.container}>
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search a movie by title, description, or genre..."
      className={style.input}
    />
    <input
      list="genre-list"
      value={genre}
      onChange={(e) => setGenre(e.target.value)}
      placeholder="Filter by genre (optional)"
      className={style.genreInput}
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
      className={style.languageInput}
    />

    <div className={style.yearRow}>
      <input
        type="number"
        placeholder="Start year"
        value={yearStart}
        onChange={(e) => setYearStart(e.target.value)}
        className={style.yearInput}
      />
      <input
        type="number"
        placeholder="End year"
        value={yearEnd}
        onChange={(e) => setYearEnd(e.target.value)}
        className={style.yearInput}
      />
    </div>

    <button onClick={handleSearch} className={style.searchButton}>
      🔍 Search
    </button>
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