import styles from './BigMovieCard.module.css';

export default function BigMovieCard({ movie, liked, onClick }) {
  return (
    <div className={styles.bigCard} onClick={onClick}>
      {movie.poster_path ? (
        <img
          src={movie.poster_path}
          alt={`${movie.title} poster`}
          className={styles.posterBg}
          loading="lazy"
          draggable={false}
        />
      ) : (
        <div className={styles.posterBg} style={{background:'#444',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>No Poster</div>
      )}
      <div className={styles.gradientOverlay}></div>
      <div className={styles.info}>
        <h2 className={styles.title}>
          {movie.title}
          {liked && <span className={styles.check}>✅</span>}
        </h2>
        <div className={styles.genres}>
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
        </div>
        <div className={styles.overview}>{movie.overview}</div>
        <div className={styles.release}>Released: {movie.release_date}</div>
      </div>
    </div>
  );
}