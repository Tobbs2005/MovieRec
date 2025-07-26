'use client';

import { useEffect, useState } from 'react';
import SwipeCard from './SwipeCard';
import BigMovieCard from './BigMovieCard';
import MovieFilterBar from './MovieFilterBar';
import styles from './SwipeReccomender.module.css';

const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller', 'Animation', 'Science Fiction', 'Fantasy'];
const languages = ['en', 'fr', 'es', 'ja', 'ko', 'zh', 'de', 'hi'];

export default function SwipeRecommender({
  preLikedIds,
  handleLike,
  handleDislike,
  handleSave,
}) {
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
      // Feedback error handling
    }
  };

  // Updated handlers to call global handlers with movie object
  const handleLikeClick = async () => {
    if (!currentMovie) return;
    const id = currentMovie.movieId;
    await sendFeedback(id, 'like');
    const updatedSeen = [...seenIds, id];
    const updatedLiked = [...likedIds, id];
    setSeenIds(updatedSeen);
    setLikedIds(updatedLiked);
    handleLike(id, currentMovie); // <-- call global handler
    await fetchRecommendation(updatedSeen, updatedLiked);
  };

  const handleDislikeClick = async () => {
    if (!currentMovie) return;
    const id = currentMovie.movieId;
    await sendFeedback(id, 'dislike');
    const updatedSeen = [...seenIds, id];
    setSeenIds(updatedSeen);
    handleDislike(id, currentMovie); // <-- call global handler
    await fetchRecommendation(updatedSeen, likedIds);
  };

  const handleWatchLaterClick = async () => {
    if (!currentMovie) return;
    const id = currentMovie.movieId;
    const updatedSeen = [...seenIds, id];
    setSeenIds(updatedSeen);
    handleSave(id, currentMovie); // <-- call global handler
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
    <div className={styles.swipeContainer}>
      <div className={styles.filterBarWrapper}>
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
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {loading && <p className={styles.loading}>Loading...</p>}

      {currentMovie && !loading && (
        <div className={styles.swipeCardWrapper}>
          <SwipeCard onSwipeLeft={handleDislikeClick} onSwipeRight={handleLikeClick}>
            <BigMovieCard movie={currentMovie} liked={likedIds.includes(currentMovie.movieId)} />
          </SwipeCard>
        </div>
      )}

      {/* On boarding note */}
      {likedIds.length < 5 && (
        <div className={styles.learningNote}>
          The algorithm is still learning your taste...
        </div>
      )}

      {currentMovie && !loading && (
        <div className={styles.actionButtons}>
          <button onClick={handleWatchLaterClick}>
            ⭐ Add to Watch Later
          </button>
          <button onClick={handleSkip}>
            ⏭️ Skip
          </button>
        </div>
      )}
      
    </div>
  );
}