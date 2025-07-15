import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import './App.css';
import Home from './pages/Home';
import UserMovieList from './components/UserMovieList';

export default function App() {
  const [route, setRoute] = useState('/');

  return (
    <div className="layout">
      <Sidebar route={route} setRoute={setRoute} />
      <main className="main-content">
        {route === '/' && <Home />}
        {route === '/mymovies' && <UserMovieList />}
      </main>
    </div>
  );
}
