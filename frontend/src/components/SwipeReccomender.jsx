import { useEffect, useState } from 'react';
import MovieCard from './MovieCard';

export default function SwipeRecommender({ preLikedIds }) {
  const [currentMovie, setCurrentMovie] = useState(null);
  const [userVector, setUserVector] = useState(null);
  const [seenIds, setSeenIds] = useState([]);
  const [likedIds, setLikedIds] = useState(preLikedIds || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (preLikedIds) {
      console.log("✅ Starting with liked IDs:", preLikedIds);
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
      if (data.user_vector) {
        setUserVector(data.user_vector);
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

  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {loading && <p>Loading...</p>}

      {currentMovie && !loading && (
        <>
          <MovieCard movie={currentMovie} liked={likedIds.includes(currentMovie.movieId)} onClick={() => {}} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <button onClick={handleDislike} style={{ padding: '8px 16px', background: '#f87171', color: '#fff', borderRadius: '9999px' }}>👎 Dislike</button>
            <button onClick={handleLike} style={{ padding: '8px 16px', background: '#4ade80', color: '#fff', borderRadius: '9999px' }}>👍 Like</button>
          </div>
        </>
      )}
    </div>
  );
}
