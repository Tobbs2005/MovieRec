import { useState } from 'react';
import UserPreference from './components/UserPreference';
import SwipeRecommender from './components/SwipeReccomender';
import './App.css'; // Make sure this line is present to load CSS

export default function App() {
  const [likedIds, setLikedIds] = useState([]);
  const [started, setStarted] = useState(false);

  const handleStartSwiping = (initialLikedIds) => {
    setLikedIds(initialLikedIds);
    setStarted(true);
  };

  return (
    <div className="app-container">
      {!started ? (
        <UserPreference onStart={handleStartSwiping} />
      ) : (
        <SwipeRecommender preLikedIds={likedIds} />
      )}
    </div>
  );
}
