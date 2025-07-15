'use client';

import { useEffect, useState } from 'react';
import MovieCard from './MovieCard';
import SwipeCard from './SwipeCard';

const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller', 'Animation', 'Science Fiction', 'Fantasy'];
const languages = ['en', 'fr', 'es', 'ja', 'ko', 'zh', 'de', 'hi'];

export default function SwipeRecommender({ preLikedIds }) {
  const [currentMovie, setCurrentMovie] = useState(null);
  const [userVector, setUserVector] = useState(null);
  const [seenIds, setSeenIds] = useState([]);
  const [likedIds, setLikedIds] = useState(preLikedIds || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [genre, setGenre] = useState('');
  const [language, setLanguage] = useState('');
  const [yearStart, setYearStart] = useState(1980);
  const [yearEnd, setYearEnd] = useState(2024);
  const [adult, setAdult] = useState(false);

  useEffect(() => {
    if (preLikedIds) {
      fetchRecommendation(userVector, seenIds, preLikedIds);
    }
  }, [preLikedIds]);

  const fetchRecommendation = async (vector, seen, liked) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentMovie(null); // clear immediately to show loading state

      const res = await fetch('http://localhost:8000/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_vector: vector,
          seen_ids: seen,
          liked_ids: liked,
          genre,
          language,
          year_start: yearStart,
          year_end: yearEnd,
          adult,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('❌ Backend error:', res.status, text);
        setError(`Error ${res.status}: ${text}`);
        return;
      }

      const text = await res.text();
      if (!text) {
        setError('Empty response from backend');
        console.error('❌ No content returned from /recommend');
        return;
      }

      const data = JSON.parse(text);

      if (!data.error) {
        setCurrentMovie(data.movie);
        setUserVector(data.user_vector);
      } else {
        setError(data.error);
        setCurrentMovie(null);
      }
    } catch (err) {
      console.error('❌ JSON parse or network error:', err);
      setError('Unexpected response format or connection error');
    } finally {
      setLoading(false);
    }
  };

  const sendFeedback = async (movieId, feedbackType) => {
    try {
      const res = await fetch('http://localhost:8000/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movie_id: movieId,
          feedback: feedbackType,
          user_vector: userVector,
        }),
      });

      const data = await res.json();
      if (data.user_vector) {
        setUserVector(data.user_vector);
        return data.user_vector;
      }
    } catch (err) {
      console.error('❌ Feedback error:', err);
    }
    return userVector; // fallback
  };

  const handleLike = async () => {
    if (!currentMovie) return;
    const id = currentMovie.movieId;

    const updatedSeen = [...seenIds, id];
    const updatedLiked = [...likedIds, id];
    setSeenIds(updatedSeen);
    setLikedIds(updatedLiked);

    setLoading(true);
    setCurrentMovie(null);

    const feedbackPromise = sendFeedback(id, 'like');
    const updatedVector = await feedbackPromise;

    await fetchRecommendation(updatedVector, updatedSeen, updatedLiked);
  };

  const handleDislike = async () => {
    if (!currentMovie) return;
    const id = currentMovie.movieId;

    const updatedSeen = [...seenIds, id];
    setSeenIds(updatedSeen);

    setLoading(true);
    setCurrentMovie(null);

    const feedbackPromise = sendFeedback(id, 'dislike');
    const updatedVector = await feedbackPromise;

    await fetchRecommendation(updatedVector, updatedSeen, likedIds);
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* === Filters === */}
      <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="">All Genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="">All Languages</option>
          {languages.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label>Year: </label>
          <input type="number" min="1900" max="2025" value={yearStart} onChange={(e) => setYearStart(Number(e.target.value))} />
          <label> - </label>
          <input type="number" min="1900" max="2025" value={yearEnd} onChange={(e) => setYearEnd(Number(e.target.value))} />
        </div>

        <label>
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} /> Include adult content
        </label>

        <button
          onClick={() => fetchRecommendation(userVector, seenIds, likedIds)}
          style={{ background: '#3b82f6', color: 'white', padding: '8px', borderRadius: '8px' }}
        >
          🔍 Apply Filters
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>Loading next movie...</p>}

      {currentMovie && !loading && (
        <SwipeCard onSwipeLeft={handleDislike} onSwipeRight={handleLike}>
          <MovieCard movie={currentMovie} liked={likedIds.includes(currentMovie.movieId)} />
        </SwipeCard>
      )}
    </div>
  );
}
