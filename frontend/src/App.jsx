import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import './App.css';
import Home from './pages/Home';
import UserMovieList from './components/UserMovieList';

export default function App() {
  const [route, setRoute] = useState('/');

  // Centralized movie states
  const [likedMovies, setLikedMovies] = useState([]);
  const [dislikedMovies, setDislikedMovies] = useState([]);
  const [savedMovies, setSavedMovies] = useState([]);
  const [likedIds, setLikedIds] = useState([]);
  const [dislikedIds, setDislikedIds] = useState([]);

  // Handlers to update lists
  const handleLike = (movieId, movieObj) => {
    if (!likedIds.includes(movieId)) {
      setLikedIds([...likedIds, movieId]);
      setLikedMovies([...likedMovies, movieObj]);
      // Remove from disliked if present
      setDislikedIds(dislikedIds.filter(id => id !== movieId));
      setDislikedMovies(dislikedMovies.filter(m => m.movieId !== movieId));
    }
  };

  const handleDislike = (movieId, movieObj) => {
    if (!dislikedIds.includes(movieId)) {
      setDislikedIds([...dislikedIds, movieId]);
      setDislikedMovies([...dislikedMovies, movieObj]);
      // Remove from liked if present
      setLikedIds(likedIds.filter(id => id !== movieId));
      setLikedMovies(likedMovies.filter(m => m.movieId !== movieId));
    }
  };

  const handleSave = (movieId, movieObj) => {
    if (!savedMovies.some(m => m.movieId === movieId)) {
      setSavedMovies([...savedMovies, movieObj]);
    }
  };

  const handleRemove = (movieId) => {
    setLikedMovies(likedMovies.filter(m => m.movieId !== movieId));
    setDislikedMovies(dislikedMovies.filter(m => m.movieId !== movieId));
    setSavedMovies(savedMovies.filter(m => m.movieId !== movieId));
    setLikedIds(likedIds.filter(id => id !== movieId));
    setDislikedIds(dislikedIds.filter(id => id !== movieId));
  };

  return (
    <div className="layout">
      <Sidebar route={route} setRoute={setRoute} />
      <main className="main-content">
        {route === '/' && (
          <Home
            likedIds={likedIds}
            setLikedIds={setLikedIds}
            handleLike={handleLike}
            handleDislike={handleDislike}
            handleSave={handleSave}
          />
        )}
        {route === '/mymovies' && (
          <UserMovieList
            likedMovies={likedMovies}
            dislikedMovies={dislikedMovies}
            savedMovies={savedMovies}
            likedIds={likedIds}
            dislikedIds={dislikedIds}
            onLike={handleLike}
            onDislike={handleDislike}
            onRemove={handleRemove}
          />
        )}
      </main>
    </div>
  );
}
