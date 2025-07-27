import SwipeRecommender from '../components/SwipeReccomender';
import SearchBar from '../components/SearchBar';
import { useState } from 'react';


export default function Home({
  likedIds,
  setLikedIds,
  handleLike,
  handleDislike,
  handleSave,
}) {
  const [started, setStarted] = useState(false);

  const handleStartSwiping = (initialLikedIds) => {
    setLikedIds(initialLikedIds);
    setStarted(true);
  };

  return (
    <div>
      {!started ? (
        <div className="part-one">
          <SearchBar onStart={handleStartSwiping} />  
          
        </div>
      ) : (
        <SwipeRecommender
          preLikedIds={likedIds}
          handleLike={handleLike}
          handleDislike={handleDislike}
          handleSave={handleSave}
        />
      )}
    </div>
  );
}