import React, { useState } from 'react';

const SetupScreen = ({ onStartGame }) => {
  const [totalPlayers, setTotalPlayers] = useState(4);
  const [numImposters, setNumImposters] = useState(1);

  const handleStartGame = () => {
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
    onStartGame({ totalPlayers, numImposters });
  };

  return (
    <div className="setup-container">
      {/* Ensure this points to game_logo.png for the setup screen */}
      <img src="/game_logo.png" alt="Football Imposter Logo" className="setup-logo" />

      <h1 className="setup-title">Game Setup</h1>

      <div className="setup-input-group">
        <label htmlFor="totalPlayers" className="setup-label">Total Players:</label>
        <input
          type="number"
          id="totalPlayers"
          value={totalPlayers}
          onChange={(e) => setTotalPlayers(Math.max(2, parseInt(e.target.value) || 2))}
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
          onChange={(e) => setNumImposters(Math.max(1, Math.min(totalPlayers - 1, parseInt(e.target.value) || 1)))}
          className="setup-input"
          min="1"
          max={totalPlayers - 1}
        />
      </div>

      <button onClick={handleStartGame} className="setup-start-btn">
        Start Game
      </button>
    </div>
  );
};

export default SetupScreen;