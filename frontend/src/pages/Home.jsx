import { useState } from 'react';
import UserPreference from '../components/UserPreference';
import SwipeRecommender from '../components/SwipeReccomender';


export default function Home() {
  const [likedIds, setLikedIds] = useState([]);
  const [started, setStarted] = useState(false);

  const handleStartSwiping = (initialLikedIds) => {
    setLikedIds(initialLikedIds);
    setStarted(true);
  };

  return (
    <div>
      {!started ? (
        <UserPreference onStart={handleStartSwiping} />
      ) : (
        <SwipeRecommender preLikedIds={likedIds} />
      )}
    </div>
  );
}
