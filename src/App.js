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
    commonFootballerName: '' // Will store the randomly chosen common footballer name
  });

  // State to manage game phases: 'discussion', 'voting', 'imposter_answer', 'game_over'
  const [gamePhase, setGamePhase] = useState('discussion'); // Initial phase after setup
  const [gameStatus, setGameStatus] = useState('Waiting for players...');

  // State to hold the list of players.
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

  // Voting related states
  const [votes, setVotes] = useState({}); // Stores votes: { playerId: count }
  const [votedPlayerId, setVotedPlayerId] = useState(null); // Player chosen by vote
  const [imposterAnswerInput, setImposterAnswerInput] = useState(''); // Imposter's typed answer
  const [gameOverMessage, setGameOverMessage] = useState(''); // Message displayed at game end

  // Effect to manage the countdown timer
  useEffect(() => {
    if (timerActive && timeLeft > 0 && gamePhase === 'discussion') {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && gamePhase === 'discussion') {
      clearInterval(timerRef.current);
      setTimerActive(false);
      setGameStatus('Time is up! Voting has begun.');
      setGamePhase('voting'); // Automatically transition to voting phase
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive, timeLeft, gamePhase]);

  // Function to format time from seconds into MM:SS format
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Function to handle game start from SetupScreen
  const handleGameStartFromSetup = (config) => {
    // Select ONE random footballer name from the list to be common for all footballers
    const randomFootballerIndex = Math.floor(Math.random() * FOOTBALLERS_LIST.length);
    const commonFootballerName = FOOTBALLERS_LIST[randomFootballerIndex];

    setGameConfig({ ...config, commonFootballerName }); // Store common footballer name in config
    setGameStarted(true); // Transition to game screen
    setGamePhase('discussion'); // Set initial phase

    // Initialize players based on the setup config
    const initialPlayers = [];
    for (let i = 1; i <= config.totalPlayers; i++) {
      initialPlayers.push({
        id: i,
        name: `Player ${i}`,
        role: 'Unknown',
        assignedName: 'Unknown',
        isRoleVisible: false
      });
    }
    setPlayers(initialPlayers);
    assignRoles(initialPlayers, config.numImposters, commonFootballerName);

    setGameStatus('Roles assigned. Click "Start Round" to begin discussion!');
    setTimeLeft(300); // Reset timer to 5 minutes
    setTimerActive(false); // Timer is NOT active yet
  };

  // Function to assign roles and specific names to players
  const assignRoles = (currentPlayers, numImposters, commonFootballerName) => {
    const rolesPool = Array(numImposters).fill('Imposter');
    const numFootballers = currentPlayers.length - numImposters;

    if (numFootballers < 0) {
      console.error('Error: More imposters than players!');
      setGameStatus('Error: Invalid setup (more imposters than players).');
      return;
    }
    rolesPool.push(...Array(numFootballers).fill('Footballer'));

    const shuffledRoles = rolesPool.sort(() => Math.random() - 0.5);

    const playersWithAssignedRoles = currentPlayers.map((player, index) => {
      let assignedRoleType = shuffledRoles[index];
      let assignedNameForPlayer;

      if (assignedRoleType === 'Imposter') {
        assignedNameForPlayer = 'YOU ARE THE IMPOSTER';
      } else {
        assignedNameForPlayer = commonFootballerName;
      }

      return {
        ...player,
        role: assignedRoleType,
        assignedName: assignedNameForPlayer,
        isRoleVisible: false
      };
    });
    setPlayers(playersWithAssignedRoles);
  };

  // --- Game Phase Control Functions ---
  const startRound = () => {
    if (gamePhase === 'discussion' && !timerActive) {
      setTimerActive(true);
      setGameStatus('Round in progress! Find the Imposter!');
    }
  };

  const pauseRound = () => {
    setTimerActive(false);
    setGameStatus('Round Paused.');
    clearInterval(timerRef.current);
  };

  const startVotingPhase = () => {
    clearInterval(timerRef.current);
    setTimerActive(false);
    setGamePhase('voting');
    setGameStatus('Time to vote! Choose who you think the Imposter is.');
    setVotes({}); // Reset votes for a new voting phase
  };

  const handleVote = (votedForPlayerId) => {
    // For simplicity, each player can vote once.
    // In a real game, you'd track who voted for whom.
    setVotes(prevVotes => ({
      ...prevVotes,
      [votedForPlayerId]: (prevVotes[votedForPlayerId] || 0) + 1
    }));
    setGameStatus(`Vote cast for Player ${votedForPlayerId}.`);

    // After all players vote (or a set number of votes), determine outcome
    // For now, let's assume a simple majority after a few votes, or a "Confirm Votes" button.
    // For this example, let's just count all votes and then proceed after a short delay
    // or when a "Confirm Votes" button is clicked (which we'll add).
  };

  const confirmVotes = () => {
    if (Object.keys(votes).length === 0) {
      setGameStatus('No votes cast. Game ends in a draw or re-vote.');
      setGameOverMessage('No votes cast. Game ends in a draw.');
      setGamePhase('game_over');
      return;
    }

    let maxVotes = 0;
    let suspectedPlayerId = null;
    let tie = false;

    for (const id in votes) {
      if (votes[id] > maxVotes) {
        maxVotes = votes[id];
        suspectedPlayerId = parseInt(id);
        tie = false;
      } else if (votes[id] === maxVotes) {
        tie = true; // It's a tie
      }
    }

    if (tie || suspectedPlayerId === null) {
      setGameStatus('Voting resulted in a tie or no clear suspect. Footballers win by default.');
      setGameOverMessage('It\'s a tie! Footballers win as Imposter was not clearly identified.');
      setGamePhase('game_over');
      return;
    }

    const suspectedPlayer = players.find(p => p.id === suspectedPlayerId);

    if (suspectedPlayer.role === 'Imposter') {
      setGameStatus(`Player ${suspectedPlayer.name} was voted out! They were the Imposter!`);
      setVotedPlayerId(suspectedPlayerId); // Store who was voted out
      setGamePhase('imposter_answer'); // Imposter gets to answer
    } else {
      setGameStatus(`Player ${suspectedPlayer.name} was voted out. They were a Footballer!`);
      setGameOverMessage('Footballers voted out a Footballer! Imposter wins!');
      setGamePhase('game_over');
    }
  };

  const handleImposterAnswerSubmit = () => {
    const imposterPlayer = players.find(p => p.id === votedPlayerId);
    if (!imposterPlayer || imposterPlayer.role !== 'Imposter') {
      setGameOverMessage('Error: No Imposter to answer or wrong phase.');
      setGamePhase('game_over');
      return;
    }

    // Check if the imposter's answer matches the common footballer name
    if (imposterAnswerInput.trim().toLowerCase() === gameConfig.commonFootballerName.toLowerCase()) {
      setGameOverMessage(`The Imposter (${imposterPlayer.name}) correctly named "${gameConfig.commonFootballerName}"! Imposter wins!`);
    } else {
      setGameOverMessage(`The Imposter (${imposterPlayer.name}) failed to name "${gameConfig.commonFootballerName}". Footballers win!`);
    }
    setGamePhase('game_over');
  };

  // --- Modal Functions ---
  const openRoleModal = (player) => {
    setSelectedPlayerId(player.id);
    setPlayerNameInput(player.name);
    setIsCardFlipped(false);
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

  // Render game over screen
  if (gamePhase === 'game_over') {
    return (
      <div className="app-container game-over-screen">
        <div className="game-card game-over-card">
          <h1 className="game-title">Game Over!</h1>
          <p className="game-over-message">{gameOverMessage}</p>
          <button
            onClick={() => {
              // Reset all game states to go back to setup
              setGameStarted(false);
              setGameConfig({ totalPlayers: 0, numImposters: 0, commonFootballerName: '' });
              setGamePhase('discussion');
              setGameStatus('Waiting for players...');
              setPlayers([]);
              setTimeLeft(300);
              setTimerActive(false);
              setVotes({});
              setVotedPlayerId(null);
              setImposterAnswerInput('');
              setGameOverMessage('');
            }}
            className="setup-start-btn" // Reusing setup button style
          >
            Play Again
          </button>
        </div>
      </div>
    );
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

        {/* Timer is always displayed now, but only counts down when active */}
        <div className="timer-display">
          Time Left: {formatTime(timeLeft)}
        </div>

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
              </div>
            ))}
          </div>
        </div>

        <div className="action-buttons">
          {gamePhase === 'discussion' && (
            <>
              {!timerActive ? (
                <button onClick={startRound} className="start-game-btn">
                  Start Round
                </button>
              ) : (
                <button onClick={pauseRound} className="pause-game-btn">
                  Pause
                </button>
              )}
              <button onClick={startVotingPhase} className="vote-time-btn">
                Voting Time
              </button>
            </>
          )}

          {gamePhase === 'voting' && (
            <div className="voting-section">
              <h3>Vote for Imposter:</h3>
              <div className="vote-buttons-grid">
                {players.map(player => (
                  <button
                    key={`vote-${player.id}`}
                    onClick={() => handleVote(player.id)}
                    className="vote-player-btn"
                  >
                    {player.name} ({votes[player.id] || 0})
                  </button>
                ))}
              </div>
              <button onClick={confirmVotes} className="confirm-vote-btn">
                Confirm Votes
              </button>
            </div>
          )}

          {gamePhase === 'imposter_answer' && votedPlayerId && (
            <div className="imposter-answer-section">
              <h3>Imposter's Last Stand!</h3>
              <p>You were voted out. Prove you are a Footballer by naming the common footballer:</p>
              <input
                type="text"
                value={imposterAnswerInput}
                onChange={(e) => setImposterAnswerInput(e.target.value)}
                placeholder="Enter common footballer name"
                className="imposter-answer-input"
                autoFocus
              />
              <button onClick={handleImposterAnswerSubmit} className="submit-answer-btn">
                Submit Answer
              </button>
            </div>
          )}

          <button onClick={() => {
            // Reset all game states to go back to setup
            setGameStarted(false);
            setGameConfig({ totalPlayers: 0, numImposters: 0, commonFootballerName: '' });
            setGamePhase('discussion'); // Reset phase for next game
            setGameStatus('Waiting for players...');
            setPlayers([]);
            setTimeLeft(300);
            setTimerActive(false);
            setVotes({});
            setVotedPlayerId(null);
            setImposterAnswerInput('');
            setGameOverMessage('');
          }} className="restart-game-btn">
            New Game
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
