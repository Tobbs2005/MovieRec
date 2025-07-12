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
      fetchRecommendation(null, [], preLikedIds);
    }
  }, [preLikedIds]);

  const fetchRecommendation = async (vector, seen, liked) => {
    try {
      setLoading(true);
      setError(null);
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
      const data = await res.json();
      if (!data.error) {
        setCurrentMovie(data.movie);
        setUserVector(data.user_vector);
      } else {
        setError(data.error);
        setCurrentMovie(null);
      }
    } catch (err) {
      console.error("❌ Error fetching recommendation:", err);
      setError("Failed to fetch recommendation");
    } finally {
      setLoading(false);
    }
  };

const sendFeedback = async (movieId, feedbackType) => {
  try {
    console.log("🛰️ Sending feedback:", { movieId, feedbackType, userVector });
    const res = await fetch('http://localhost:8000/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_vector: userVector,
        movie_id: movieId,
        feedback: feedbackType,
      }),
    });
    const data = await res.json();
    console.log("✅ Feedback response:", data);

    if (data.user_vector) {
      setUserVector(data.user_vector);
    } else {
      console.warn("⚠️ No user_vector returned from feedback");
    }
  } catch (err) {
    console.error("❌ Feedback error:", err);
  }
};



  const handleLike = async () => {
    if (!currentMovie) return;
    const id = currentMovie.movieId;
    await sendFeedback(id, 'like');
    const updatedSeen = [...seenIds, id];
    const updatedLiked = [...likedIds, id];
    setSeenIds(updatedSeen);
    setLikedIds(updatedLiked);
    await fetchRecommendation(userVector, updatedSeen, updatedLiked);
  };

  const handleDislike = async () => {
    if (!currentMovie) return;
    const id = currentMovie.movieId;
    await sendFeedback(id, 'dislike');
    const updatedSeen = [...seenIds, id];
    setSeenIds(updatedSeen);
    await fetchRecommendation(userVector, updatedSeen, likedIds);
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
          <label>Year: {yearStart} – {yearEnd}</label>
          <input type="range" min="1900" max="2025" value={yearStart} onChange={(e) => setYearStart(Number(e.target.value))} />
          <input type="range" min="1900" max="2025" value={yearEnd} onChange={(e) => setYearEnd(Number(e.target.value))} />
        </div>

        <label>
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} /> Include adult content
        </label>

        <button onClick={() => fetchRecommendation(userVector, seenIds, likedIds)} style={{ background: '#3b82f6', color: 'white', padding: '8px', borderRadius: '8px' }}>
          🔍 Apply Filters
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>Loading...</p>}

      {currentMovie && !loading && (
        <>
        <SwipeCard onSwipeLeft={handleDislike} onSwipeRight={handleLike}>
            <MovieCard movie={currentMovie} liked={likedIds.includes(currentMovie.movieId)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <button onClick={handleDislike} style={{ padding: '8px 16px', background: '#f87171', color: '#fff', borderRadius: '9999px' }}>👎 Dislike</button>
              <button onClick={handleLike} style={{ padding: '8px 16px', background: '#4ade80', color: '#fff', borderRadius: '9999px' }}>👍 Like</button>
            </div>
          </SwipeCard>
        </>
      )}
    </div>
  );
}
