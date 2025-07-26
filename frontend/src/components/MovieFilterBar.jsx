import styles from './MovieFilterBar.module.css';

export default function MovieFilterBar({
  genres,
  languages,
  genre,
  setGenre,
  language,
  setLanguage,
  yearStart,
  setYearStart,
  yearEnd,
  setYearEnd,
  adult,
  setAdult,
  onApplyFilters,
}) {
  return (
    <div className={styles.filterBar}>
      <select
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
        className={styles.select}
      >
        <option value="">All Genres</option>
        {genres.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>

      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className={styles.select}
      >
        <option value="">All Languages</option>
        {languages.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>

      <div className={styles.yearRow}>
        <label>Year: </label>
        <input
          type="number"
          min="1900"
          max="2025"
          value={yearStart}
          onChange={(e) => setYearStart(Number(e.target.value))}
          className={styles.input}
        />
        <label> - </label>
        <input
          type="number"
          min="1900"
          max="2025"
          value={yearEnd}
          onChange={(e) => setYearEnd(Number(e.target.value))}
          className={styles.input}
        />
      </div>

      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={adult}
          onChange={(e) => setAdult(e.target.checked)}
          className={styles.checkbox}
        />
        Include Adult
      </label>

      <button
        onClick={onApplyFilters}
        className={styles.button}
      >
        🔍 Apply Filters
      </button>
    </div>
  );
}