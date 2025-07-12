/**
 * App.jsx
 * The main app page that toggles between UserPreference and SwipeRecommender.
 */

import { useState } from 'react';
import UserPreference from './components/UserPreference';
import SwipeRecommender from './components/SwipeReccomender';

export default function App() {
  const [likedIds, setLikedIds] = useState([]);
  const [started, setStarted] = useState(false);

  const handleStartSwiping = (initialLikedIds) => {
    setLikedIds(initialLikedIds);
    setStarted(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {!started ? (
        <UserPreference onStart={handleStartSwiping} />
      ) : (
        <SwipeRecommender preLikedIds={likedIds} />
      )}
    </div>
  );
}