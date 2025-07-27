const MovieList = ({ title, movies, onLike, onDislike, onRemove, likedIds, dislikedIds }) => {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>{title}</h2>
      {movies.length === 0 ? (
        <p style={{ color: '#666' }}>No movies</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {movies.map((movie) => {
            const isLiked = likedIds.includes(movie.movieId);
            const isDisliked = dislikedIds.includes(movie.movieId);

            return (
              <li key={movie.movieId} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
                <img src={movie.poster_path} alt={movie.title} style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '4px' }} />
                <div style={{ flex: 1 }}>
                  <strong>{movie.title}</strong>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>{movie.genres}</p>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => onLike(movie.movieId)} style={{ background: isLiked ? '#22c55e' : '#e5e7eb', padding: '4px 8px', borderRadius: '4px' }}>👍</button>
                  <button onClick={() => onDislike(movie.movieId)} style={{ background: isDisliked ? '#ef4444' : '#e5e7eb', padding: '4px 8px', borderRadius: '4px' }}>👎</button>
                  <button onClick={() => onRemove(movie.movieId)} style={{ background: '#d1d5db', padding: '4px 8px', borderRadius: '4px' }}>❌</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default MovieList;