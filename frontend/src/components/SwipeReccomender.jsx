'use client';

import { useEffect, useState } from 'react';
import MovieCard from './MovieCard';
import SwipeCard from './SwipeCard';
import BigMovieCard from './BigMovieCard';
import MovieFilterBar from './MovieFilterBar';

const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller', 'Animation', 'Science Fiction', 'Fantasy'];
const languages = ['en', 'fr', 'es', 'ja', 'ko', 'zh', 'de', 'hi'];

export default function SwipeRecommender({ preLikedIds }) {
  const [currentMovie, setCurrentMovie] = useState(null);
  const [userVector, setUserVector] = useState(null);
  const [seenIds, setSeenIds] = useState([]);
  const [likedIds, setLikedIds] = useState(preLikedIds || []);
  const [watchLater, setWatchLater] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [genre, setGenre] = useState('');
  const [language, setLanguage] = useState('');
  const [yearStart, setYearStart] = useState(1980);
  const [yearEnd, setYearEnd] = useState(2024);
  const [adult, setAdult] = useState(false);

  useEffect(() => {
    if (preLikedIds) {
      fetchRecommendation(seenIds, preLikedIds);
    }
  }, [preLikedIds]);

  const fetchRecommendation = async (seen, liked) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('http://localhost:8000/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

      const data = await res.json();

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
      await fetch('http://localhost:8000/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movie_id: movieId,
          feedback: feedbackType,
        }),
      });
    } catch (err) {
      console.error('❌ Feedback error:', err);
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
    await fetchRecommendation(updatedSeen, updatedLiked);
  };

  const handleDislike = async () => {
    if (!currentMovie) return;
    const id = currentMovie.movieId;
    await sendFeedback(id, 'dislike');
    const updatedSeen = [...seenIds, id];
    setSeenIds(updatedSeen);
    await fetchRecommendation(updatedSeen, likedIds);
  };

  const handleWatchLater = async () => {
    if (!currentMovie) return;
    const id = currentMovie.movieId;
    const updatedSeen = [...seenIds, id];
    setWatchLater((prev) => [...prev, id]);
    setSeenIds(updatedSeen);
    await fetchRecommendation(updatedSeen, likedIds);
  };

  const handleSkip = async () => {
    if (!currentMovie) return;
    const id = currentMovie.movieId;
    const updatedSeen = [...seenIds, id];
    setSeenIds(updatedSeen);
    await fetchRecommendation(updatedSeen, likedIds);
  };

  return (
 <div>
      <MovieFilterBar
        genres={genres}
        languages={languages}
        genre={genre}
        setGenre={setGenre}
        language={language}
        setLanguage={setLanguage}
        yearStart={yearStart}
        setYearStart={setYearStart}
        yearEnd={yearEnd}
        setYearEnd={setYearEnd}
        adult={adult}
        setAdult={setAdult}
        onApplyFilters={() => fetchRecommendation(seenIds, likedIds)}
      />

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>Loading...</p>}


      {currentMovie && !loading && (
        <div>
          <SwipeCard onSwipeLeft={handleDislike} onSwipeRight={handleLike}>
            <BigMovieCard movie={currentMovie} liked={likedIds.includes(currentMovie.movieId)} />
          </SwipeCard>

          <div>
            <button onClick={handleWatchLater}>
              ⭐ Add to Watch Later
            </button>
            <button onClick={handleSkip}>
              ⏭️ Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
