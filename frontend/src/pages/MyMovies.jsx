import MyMoviesDisplay from "../components/MyMoviesDisplay";

export default function MyMovies() {
  return (
    <div>
      <h1 style={{ textAlign: 'center', marginBottom: '16px' }}>My Saved Movies</h1>
      <MyMoviesDisplay />
    </div>
  );
}
