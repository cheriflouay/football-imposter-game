import React, { useState, useEffect, useRef } from 'react';
import './App.css'; // Import the CSS file
import SetupScreen from './SetupScreen'; // Import the SetupScreen component
import FOOTBALLERS_LIST from './footballers.json'; // Import the JSON file

// Main App component for the Football Imposter game interface
const App = () => {
  // State to control which screen is displayed
  const [gameStarted, setGameStarted] = useState(false);
  // State to store game configuration from SetupScreen
  const [gameConfig, setGameConfig] = useState({
    totalPlayers: 0,
    numImposters: 0,
  });

  // State to manage game status messages
  const [gameStatus, setGameStatus] = useState('Waiting for players...');

  // State to hold the list of players.
  // Initialized based on gameConfig.totalPlayers once game starts.
  const [players, setPlayers] = useState([]);

  // Modal related states
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Timer related states
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);

  // Effect to manage the countdown timer
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(timerRef.current);
      setTimerActive(false);
      setGameStatus('Time is up! Discuss and vote.');
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive, timeLeft]);

  // Function to format time from seconds into MM:SS format
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Function to handle game start from SetupScreen
  const handleGameStartFromSetup = (config) => {
    setGameConfig(config);
    setGameStarted(true); // Transition to game screen
    
    // Initialize players based on the setup config
    const initialPlayers = [];
    for (let i = 1; i <= config.totalPlayers; i++) {
      initialPlayers.push({
        id: i,
        name: `Player ${i}`,
        role: 'Unknown',
        assignedName: 'Unknown',
        isRoleVisible: false // This flag will still be used to track if a player has seen their role via modal
      });
    }
    // Set initial players and then assign roles
    setPlayers(initialPlayers);
    assignRoles(initialPlayers, config.numImposters); 
    
    setGameStatus('Game in progress! Find the Imposter!');
    setTimeLeft(300); // Reset timer to 5 minutes
    setTimerActive(true); // Activate the timer
  };

  // Function to assign roles and specific names to players
  const assignRoles = (currentPlayers, numImposters) => {
    // Create a pool of roles based on numImposters and remaining players as Footballers
    const rolesPool = Array(numImposters).fill('Imposter');
    const numFootballers = currentPlayers.length - numImposters;
    
    if (numFootballers < 0) {
      console.error('Error: More imposters than players!');
      setGameStatus('Error: Invalid setup (more imposters than players).');
      return;
    }
    rolesPool.push(...Array(numFootballers).fill('Footballer'));

    // Select ONE random footballer name from the list to be common for all footballers
    const randomFootballerIndex = Math.floor(Math.random() * FOOTBALLERS_LIST.length);
    const commonFootballerName = FOOTBALLERS_LIST[randomFootballerIndex];

    // Shuffle the roles
    const shuffledRoles = rolesPool.sort(() => Math.random() - 0.5);

    // Assign roles and specific names to players
    const playersWithAssignedRoles = currentPlayers.map((player, index) => {
      let assignedRoleType = shuffledRoles[index]; // 'Imposter' or 'Footballer'
      let assignedNameForPlayer;

      if (assignedRoleType === 'Imposter') {
        assignedNameForPlayer = 'YOU ARE THE IMPOSTER';
      } else {
        // All footballers get the same, randomly chosen name
        assignedNameForPlayer = commonFootballerName; 
      }

      return {
        ...player,
        role: assignedRoleType, // 'Imposter' or 'Footballer'
        assignedName: assignedNameForPlayer, // Specific name or Imposter message
        isRoleVisible: false // Ensure roles are hidden initially on the main cards
      };
    });
    setPlayers(playersWithAssignedRoles);
  };

  // --- Modal Functions ---
  const openRoleModal = (player) => {
    setSelectedPlayerId(player.id);
    setPlayerNameInput(player.name); // Pre-fill with current name
    setIsCardFlipped(false); // Ensure card is not flipped when opening
    setShowRoleModal(true);
  };

  const handleNameSubmit = () => {
    if (!playerNameInput.trim()) {
      alert('Please enter your name!');
      return;
    }

    const updatedPlayers = players.map(p =>
      p.id === selectedPlayerId ? { ...p, name: playerNameInput } : p
    );
    setPlayers(updatedPlayers);

    setIsCardFlipped(true);

    setTimeout(() => {
      // The isRoleVisible flag will still be set to true here,
      // but it will no longer control a visible element on the main card.
      // It could be useful for other game logic later if needed.
      setPlayers(prevPlayers => prevPlayers.map(p =>
        p.id === selectedPlayerId ? { ...p, isRoleVisible: true } : p
      ));
      setShowRoleModal(false);
      setIsCardFlipped(false);
    }, 1000);
  };

  const closeModal = () => {
    setShowRoleModal(false);
    setIsCardFlipped(false);
    setSelectedPlayerId(null);
    setPlayerNameInput('');
  };

  const currentPlayerInModal = players.find(p => p.id === selectedPlayerId);

  // --- Conditional Rendering ---
  if (!gameStarted) {
    return <SetupScreen onStartGame={handleGameStartFromSetup} />;
  }

  return (
    <div className="app-container">
      <div className="game-card">
        <h1 className="game-title">
          ⚽ Football Imposter 🕵️‍♂️
        </h1>

        <div className="status-display">
          Current Status: <span className="status-text">{gameStatus}</span>
        </div>

        {timerActive && (
          <div className="timer-display">
            Time Left: {formatTime(timeLeft)}
          </div>
        )}

        <div className="player-list-section">
          <h2 className="players-heading">Players</h2>
          <div className="player-grid">
            {players.map((player) => (
              <div
                key={player.id}
                className="player-card"
                onClick={() => openRoleModal(player)}
              >
                <span className="player-name">{player.name}</span>
                {/* REMOVED: The span that displayed the generic role (FOOTBALLER/IMPOSTER) */}
                {/* {player.isRoleVisible && (
                  <span className={`player-role ${
                    player.role === 'Imposter' ? 'role-imposter' : 'role-footballer'
                  }`}>
                    {player.role === 'Imposter' ? 'IMPOSTER' : 'FOOTBALLER'}
                  </span>
                )} */}
              </div>
            ))}
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={() => {
            const resetPlayers = players.map((player, index) => ({
              ...player,
              name: `Player ${index + 1}`,
              role: 'Unknown',
              assignedName: 'Unknown',
              isRoleVisible: false
            }));
            setPlayers(resetPlayers);
            assignRoles(resetPlayers, gameConfig.numImposters); 
            setGameStatus('Game in progress! Find the Imposter!');
            setTimeLeft(300);
            setTimerActive(true);
          }} className="start-game-btn">
            Restart Game
          </button>
        </div>

        <p className="footer-text">
          Assign roles, find the imposter, or deceive your way to victory!
        </p>
      </div>

      {/* Player Role Modal */}
      {showRoleModal && currentPlayerInModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal}>&times;</button>
            <div className={`flip-card ${isCardFlipped ? 'flipped' : ''}`}>
              <div className="flip-card-inner">
                {/* Front of the card */}
                <div className="flip-card-front">
                  <h3>Enter Your Name</h3>
                  <input
                    type="text"
                    value={playerNameInput}
                    onChange={(e) => setPlayerNameInput(e.target.value)}
                    placeholder="Your Name"
                    className="player-name-input-modal"
                    autoFocus
                  />
                  <button onClick={handleNameSubmit} className="submit-name-btn">
                    Submit
                  </button>
                </div>

                {/* Back of the card (reveals specific name/role) */}
                <div className="flip-card-back">
                  <h3>Your Role:</h3>
                  <p className={`revealed-role-text ${
                    currentPlayerInModal.role === 'Imposter' ? 'role-imposter-modal' : 'role-footballer-modal'
                  }`}>
                    {currentPlayerInModal.assignedName}
                  </p>
                  <button onClick={closeModal} className="close-role-btn">
                    Got It!
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
