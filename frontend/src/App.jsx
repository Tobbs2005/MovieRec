import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import './App.css';
import Home from './pages/Home';
import UserMovieList from './components/UserMovieList';

export default function App() {
  // Movie state
  const [likedMovies, setLikedMovies] = useState([]);
  const [dislikedMovies, setDislikedMovies] = useState([]);
  const [savedMovies, setSavedMovies] = useState([]);
  const [likedIds, setLikedIds] = useState([]);
  const [dislikedIds, setDislikedIds] = useState([]);

  // Handlers to update movie lists
  const handleMovieLike = (movieId, movieObj) => {
    if (!likedIds.includes(movieId)) {
      setLikedIds([...likedIds, movieId]);
      setLikedMovies([...likedMovies, movieObj]);
      // Remove from disliked if present
      setDislikedIds(dislikedIds.filter(id => id !== movieId));
      setDislikedMovies(dislikedMovies.filter(m => m.movieId !== movieId));
    }
  };

  const handleMovieDislike = (movieId, movieObj) => {
    if (!dislikedIds.includes(movieId)) {
      setDislikedIds([...dislikedIds, movieId]);
      setDislikedMovies([...dislikedMovies, movieObj]);
      // Remove from liked if present
      setLikedIds(likedIds.filter(id => id !== movieId));
      setLikedMovies(likedMovies.filter(m => m.movieId !== movieId));
    }
  };

  const handleMovieSave = (movieId, movieObj) => {
    if (!savedMovies.some(m => m.movieId === movieId)) {
      setSavedMovies([...savedMovies, movieObj]);
    }
  };

  const handleMovieRemove = (movieId) => {
    setLikedMovies(likedMovies.filter(m => m.movieId !== movieId));
    setDislikedMovies(dislikedMovies.filter(m => m.movieId !== movieId));
    setSavedMovies(savedMovies.filter(m => m.movieId !== movieId));
    setLikedIds(likedIds.filter(id => id !== movieId));
    setDislikedIds(dislikedIds.filter(id => id !== movieId));
  };

  return (
    <Router>
      <div className="layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  likedIds={likedIds}
                  setLikedIds={setLikedIds}
                  handleLike={handleMovieLike}
                  handleDislike={handleMovieDislike}
                  handleSave={handleMovieSave}
                />
              }
            />
            <Route
              path="/mymovies"
              element={
                <UserMovieList
                  likedMovies={likedMovies}
                  dislikedMovies={dislikedMovies}
                  savedMovies={savedMovies}
                  likedIds={likedIds}
                  dislikedIds={dislikedIds}
                  onLike={handleMovieLike}
                  onDislike={handleMovieDislike}
                  onRemove={handleMovieRemove}
                />
              }
            />

          </Routes>
        </main>
      </div>
    </Router>
  );
}
