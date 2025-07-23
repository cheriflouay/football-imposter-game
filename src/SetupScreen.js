import React, { useState } from 'react';

const SetupScreen = ({ onStartGame }) => {
  const [totalPlayers, setTotalPlayers] = useState(4); // Default to 4 players
  const [numImposters, setNumImposters] = useState(1); // Default to 1 imposter

  const handleStartGame = () => {
    // Basic validation
    if (totalPlayers < 2) {
      alert('Please enter at least 2 players.');
      return;
    }
    if (numImposters < 1) {
      alert('Please enter at least 1 imposter.');
      return;
    }
    if (numImposters >= totalPlayers) {
      alert('Number of imposters must be less than total players.');
      return;
    }

    // Pass the configuration to the parent App component
    onStartGame({ totalPlayers, numImposters }); // Removed commonFootballerName
  };

  return (
    <div className="setup-container">
      <h1 className="setup-title">Game Setup</h1>

      <div className="setup-input-group">
        <label htmlFor="totalPlayers" className="setup-label">Total Players:</label>
        <input
          type="number"
          id="totalPlayers"
          value={totalPlayers}
          onChange={(e) => setTotalPlayers(Math.max(2, parseInt(e.target.value) || 2))} // Min 2 players
          className="setup-input"
          min="2"
        />
      </div>

      <div className="setup-input-group">
        <label htmlFor="numImposters" className="setup-label">Number of Imposters:</label>
        <input
          type="number"
          id="numImposters"
          value={numImposters}
          onChange={(e) => setNumImposters(Math.max(1, Math.min(totalPlayers - 1, parseInt(e.target.value) || 1)))} // Min 1 imposter, max totalPlayers - 1
          className="setup-input"
          min="1"
          max={totalPlayers - 1}
        />
      </div>

      {/* Removed the Common Footballer Name input group */}

      <button onClick={handleStartGame} className="setup-start-btn">
        Start Game
      </button>
    </div>
  );
};

export default SetupScreen;
