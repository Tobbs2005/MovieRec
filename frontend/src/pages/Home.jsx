import { useState } from 'react';
import SwipeRecommender from '../components/SwipeReccomender';
import SearchBar from '../components/SearchBar';


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
        <SearchBar onStart={handleStartSwiping} />
      ) : (
        <SwipeRecommender preLikedIds={likedIds} />
      )}
    </div>
  );
}
