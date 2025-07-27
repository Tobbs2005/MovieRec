'use client';

import React from 'react';
import MovieList from './MovieList';



const MyMoviesDisplay = ({
  likedMovies = [],
  dislikedMovies = [], 
  savedMovies = [],
  likedIds = [],
  dislikedIds = [],
  onLike,
  onDislike,
  onRemove,
}) => {
  return (
    <div style={{ padding: '16px', maxWidth: '700px', margin: '0 auto' }}>
      <MovieList
        title="🎯 Liked Movies"
        movies={likedMovies}
        onLike={onLike}
        onDislike={onDislike}
        onRemove={onRemove}
        likedIds={likedIds}
        dislikedIds={dislikedIds}
      />
      <MovieList
        title="👎 Disliked Movies"
        movies={dislikedMovies}
        onLike={onLike}
        onDislike={onDislike}
        onRemove={onRemove}
        likedIds={likedIds}
        dislikedIds={dislikedIds}
      />
      <MovieList
        title="🎬 Watch Later"
        movies={savedMovies}
        onLike={onLike}
        onDislike={onDislike}
        onRemove={onRemove}
        likedIds={likedIds}
        dislikedIds={dislikedIds}
      />
    </div>
  );
};

export default MyMoviesDisplay;
