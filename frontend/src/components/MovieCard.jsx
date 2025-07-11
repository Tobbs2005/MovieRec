import styles from './MovieCard.module.css';

export default function MovieCard({ movie, liked, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`${styles.card} ${liked ? styles.liked : ''}`}
    >
      {movie.poster_path ? (
        <img
          src={movie.poster_path}
          alt={`${movie.title} poster`}
          className={styles.poster}
        />
      ) : (
        <div className={styles.poster}>No Poster</div>
      )}

      <div className={styles.content}>
        <h3 className={styles.title}>
          {movie.title}
          {liked && <span className={styles.check}>✅</span>}
        </h3>

        <p className={styles.genres}>
          {(() => {
            try {
              const genresArray = JSON.parse(movie.genres.replace(/'/g, '"'));
              if (Array.isArray(genresArray)) {
                return genresArray.map((g) => g.name).join(', ');
              }
              return movie.genres;
            } catch (err) {
              return movie.genres;
            }
          })()}
        </p>

        <p className={styles.overview}>{movie.overview}</p>
        <p className={styles.release}>Released: {movie.release_date}</p>
      </div>
    </div>
  );
}
