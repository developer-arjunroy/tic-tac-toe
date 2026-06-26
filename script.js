/**
 * TIC TAC TOE - Production Grade Web Application
 * 
 * A modern, fully-featured Tic Tac Toe game with:
 * - Player vs Player mode
 * - Player vs Computer with difficulty levels (Easy, Medium, Hard with Minimax)
 * - Beautiful UI with light/dark theme
 * - Sound effects
 * - Move history and undo
 * - Persistent scoring via LocalStorage
 * - Animations and smooth interactions
 */

// ==========================================
// GAME STATE MANAGEMENT
// ==========================================

const app = {
  // Game state
  board: Array(9).fill(null),
  currentPlayer: 'X',
  gameActive: true,
  gameMode: null, // 'pvp' or 'pvc'
  difficulty: 'medium', // 'easy', 'medium', 'hard'
  moveHistory: [],
  
  // UI state
  soundEnabled: true,
  currentTheme: 'light',
  
  // Scores
  scores: {
    playerX: 0,
    playerO: 0,
    draws: 0,
    human: 0,
    computer: 0,
  },

  // Winning combinations (indices)
  winCombinations: [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ],

  /**
   * Initialize the application
   */
  init() {
    this.loadTheme();
    this.loadScores();
    this.loadSettings();
    this.setupEventListeners();
    this.updateScoreboard();
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
    
    // Sound toggle
    document.getElementById('soundToggle').addEventListener('click', () => this.toggleSound());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.backToHome();
    });
  },

  /**
   * Select game mode
   */
  selectGameMode(mode) {
    this.gameMode = mode;
    
    if (mode === 'pvp') {
      document.getElementById('difficultySelector').classList.add('hidden');
      document.getElementById('startButtonContainer').classList.remove('hidden');
    } else if (mode === 'pvc') {
      document.getElementById('difficultySelector').classList.remove('hidden');
      document.getElementById('startButtonContainer').classList.add('hidden');
    }
  },

  /**
   * Start a new game
   */
  startGame(difficulty = null) {
    if (difficulty) {
      this.difficulty = difficulty;
    }

    // Reset game state
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.gameActive = true;
    this.moveHistory = [];

    // Show game screen
    document.getElementById('homeScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');

    // Setup board
    this.renderBoard();
    this.updateStatus();

    // Show/hide move history based on game mode
    if (this.gameMode === 'pvp') {
      document.getElementById('moveHistory').classList.remove('hidden');
      document.getElementById('undoBtn').disabled = false;
    } else {
      document.getElementById('moveHistory').classList.add('hidden');
      document.getElementById('undoBtn').disabled = true;
    }

    // Update score labels
    if (this.gameMode === 'pvp') {
      document.getElementById('scoreLabel1').textContent = 'Player X';
      document.getElementById('scoreLabel2').textContent = 'Player O';
    } else {
      document.getElementById('scoreLabel1').textContent = 'Human (X)';
      document.getElementById('scoreLabel2').textContent = 'Computer (O)';
    }

    // Computer's first move if it's computer's turn (shouldn't happen as X starts)
    this.updateStatus();
  },

  /**
   * Render the game board UI
   */
  renderBoard() {
    const boardElement = document.getElementById('gameBoard');
    boardElement.innerHTML = '';

    this.board.forEach((value, index) => {
      const cell = document.createElement('button');
      cell.className = `
        w-24 h-24 md:w-32 md:h-32 rounded-2xl font-bold text-4xl md:text-5xl
        bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800
        border-2 border-gray-200 dark:border-gray-600
        transition-all duration-200 ease-out
        hover:shadow-lg hover:scale-105
        active:scale-95
        disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
      `;

      cell.setAttribute('aria-label', `Cell ${index + 1}`);
      cell.setAttribute('data-index', index);

      // Add value with animation
      if (value) {
        cell.textContent = value;
        cell.disabled = true;
        cell.classList.add('animate-bounce-in');
        
        // Color coding for X and O
        if (value === 'X') {
          cell.classList.add('text-indigo-600', 'dark:text-indigo-400');
        } else {
          cell.classList.add('text-pink-600', 'dark:text-pink-400');
        }
      } else {
        cell.addEventListener('click', () => this.handleCellClick(index));
        
        // Hover animation for empty cells
        cell.addEventListener('mouseenter', function() {
          if (!this.textContent) {
            this.classList.add('bg-indigo-50', 'dark:bg-gray-600');
          }
        });
        
        cell.addEventListener('mouseleave', function() {
          if (!this.textContent) {
            this.classList.remove('bg-indigo-50', 'dark:bg-gray-600');
          }
        });
      }

      boardElement.appendChild(cell);
    });
  },

  /**
   * Handle cell click
   */
  handleCellClick(index) {
    // Don't allow moves if game is not active
    if (!this.gameActive) return;
    
    // Don't allow moves on occupied cells
    if (this.board[index] !== null) return;

    // Don't allow player moves if it's computer's turn
    if (this.gameMode === 'pvc' && this.currentPlayer === 'O') return;

    this.makeMove(index);
  },

  /**
   * Make a move
   */
  makeMove(index) {
    // Record move in history
    this.moveHistory.push({
      index,
      player: this.currentPlayer,
      board: [...this.board],
    });

    // Update board
    this.board[index] = this.currentPlayer;

    // Play sound
    this.playSound('move');

    // Update UI
    this.updateMoveHistory();
    this.renderBoard();

    // Check for win or draw
    const winner = this.checkWinner();
    if (winner) {
      this.endGame(winner);
      return;
    }

    if (this.checkDraw()) {
      this.endGame('draw');
      return;
    }

    // Switch player
    this.switchPlayer();
    this.updateStatus();

    // Computer move if necessary
    if (this.gameMode === 'pvc' && this.currentPlayer === 'O' && this.gameActive) {
      setTimeout(() => this.computerMove(), 500);
    }
  },

  /**
   * Switch current player
   */
  switchPlayer() {
    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
  },

  /**
   * Computer move based on difficulty
   */
  computerMove() {
    if (!this.gameActive) return;

    let index;

    switch (this.difficulty) {
      case 'easy':
        index = this.getRandomMove();
        break;
      case 'medium':
        // 60% smart, 40% random
        index = Math.random() < 0.6 ? this.getSmartMove() : this.getRandomMove();
        break;
      case 'hard':
        index = this.getMinimaxMove();
        break;
      default:
        index = this.getRandomMove();
    }

    if (index !== null) {
      this.makeMove(index);
    }
  },

  /**
   * Get a random valid move
   */
  getRandomMove() {
    const availableCells = this.board
      .map((value, index) => (value === null ? index : null))
      .filter(value => value !== null);

    return availableCells[Math.floor(Math.random() * availableCells.length)];
  },

  /**
   * Get a smart move (prioritizes winning/blocking)
   */
  getSmartMove() {
    // Try to win
    for (let combination of this.winCombinations) {
      const [a, b, c] = combination;
      const values = [this.board[a], this.board[b], this.board[c]];
      const oCount = values.filter(v => v === 'O').length;
      const emptyCount = values.filter(v => v === null).length;

      if (oCount === 2 && emptyCount === 1) {
        return combination.find(i => this.board[i] === null);
      }
    }

    // Try to block opponent
    for (let combination of this.winCombinations) {
      const [a, b, c] = combination;
      const values = [this.board[a], this.board[b], this.board[c]];
      const xCount = values.filter(v => v === 'X').length;
      const emptyCount = values.filter(v => v === null).length;

      if (xCount === 2 && emptyCount === 1) {
        return combination.find(i => this.board[i] === null);
      }
    }

    // Take center if available
    if (this.board[4] === null) return 4;

    // Take a corner if available
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => this.board[i] === null);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // Random move
    return this.getRandomMove();
  },

  /**
   * Get best move using Minimax algorithm
   */
  getMinimaxMove() {
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < 9; i++) {
      if (this.board[i] === null) {
        this.board[i] = 'O';
        const score = this.minimax(0, false);
        this.board[i] = null;

        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }

    return bestMove;
  },

  /**
   * Minimax algorithm for optimal AI play
   */
  minimax(depth, isMaximizing) {
    // Check terminal states
    const winner = this.checkWinnerSilent();
    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    if (this.checkDrawSilent()) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (this.board[i] === null) {
          this.board[i] = 'O';
          const score = this.minimax(depth + 1, false);
          this.board[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (this.board[i] === null) {
          this.board[i] = 'X';
          const score = this.minimax(depth + 1, true);
          this.board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  },

  /**
   * Check for winner (without updating game state)
   */
  checkWinnerSilent() {
    for (let combination of this.winCombinations) {
      const [a, b, c] = combination;
      if (
        this.board[a] &&
        this.board[a] === this.board[b] &&
        this.board[a] === this.board[c]
      ) {
        return this.board[a];
      }
    }
    return null;
  },

  /**
   * Check for draw (without updating game state)
   */
  checkDrawSilent() {
    return this.board.every(cell => cell !== null);
  },

  /**
   * Check for winner
   */
  checkWinner() {
    for (let combination of this.winCombinations) {
      const [a, b, c] = combination;
      if (
        this.board[a] &&
        this.board[a] === this.board[b] &&
        this.board[a] === this.board[c]
      ) {
        // Highlight winning cells
        this.highlightWinningCells(combination);
        return this.board[a];
      }
    }
    return null;
  },

  /**
   * Check for draw
   */
  checkDraw() {
    return this.board.every(cell => cell !== null);
  },

  /**
   * Highlight winning cells
   */
  highlightWinningCells(combination) {
    setTimeout(() => {
      combination.forEach(index => {
        const cell = document.querySelector(`[data-index="${index}"]`);
        if (cell) {
          cell.classList.add('animate-pulse', 'scale-110');
          cell.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
          cell.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.5)';
        }
      });
    }, 100);
  },

  /**
   * End game and show result
   */
  endGame(result) {
    this.gameActive = false;

    // Play sound and animation
    if (result === 'draw') {
      this.playSound('win');
      document.getElementById('drawModal').classList.remove('hidden');
      this.scores.draws++;
    } else {
      this.playSound('win');
      this.createConfetti();
      
      const winner = result;
      let title = `Player ${winner} Wins!`;
      let message = 'Congratulations!';

      if (this.gameMode === 'pvc') {
        if (winner === 'X') {
          title = '🎉 You Win!';
          message = 'Great job beating the computer!';
          this.scores.human++;
        } else {
          title = '🤖 Computer Wins!';
          message = 'Better luck next time!';
          this.scores.computer++;
        }
      } else {
        if (winner === 'X') {
          this.scores.playerX++;
        } else {
          this.scores.playerO++;
        }
      }

      document.getElementById('winTitle').textContent = title;
      document.getElementById('winMessage').textContent = message;
      document.getElementById('winModal').classList.remove('hidden');
    }

    // Update scores
    this.saveScores();
    this.updateScoreboard();
  },

  /**
   * Create confetti effect
   */
  createConfetti() {
    const container = document.getElementById('confettiContainer');
    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.top = '-10px';
      confetti.style.width = '10px';
      confetti.style.height = '10px';
      confetti.style.borderRadius = '50%';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.pointerEvents = 'none';
      confetti.style.animation = `confetti-fall ${2 + Math.random() * 1}s linear forwards`;
      confetti.style.zIndex = '40';

      container.appendChild(confetti);

      setTimeout(() => confetti.remove(), 3000);
    }
  },

  /**
   * Update game status text
   */
  updateStatus() {
    if (!this.gameActive) return;

    let status = '';
    if (this.gameMode === 'pvp') {
      status = `Player ${this.currentPlayer}'s Turn`;
    } else {
      status = this.currentPlayer === 'X' ? "Your Turn (X)" : "Computer's Turn (O)";
    }

    document.getElementById('gameStatus').textContent = status;
  },

  /**
   * Update scoreboard
   */
  updateScoreboard() {
    if (this.gameMode === 'pvp') {
      document.getElementById('score1').textContent = this.scores.playerX;
      document.getElementById('score2').textContent = this.scores.playerO;
      document.getElementById('scoreDraw').textContent = this.scores.draws;
    } else {
      document.getElementById('score1').textContent = this.scores.human;
      document.getElementById('score2').textContent = this.scores.computer;
      document.getElementById('scoreDraw').textContent = this.scores.draws;
    }

    // Update home screen stats
    const totalWins = this.scores.playerX + this.scores.playerO + this.scores.human;
    const totalLosses = this.scores.playerO + this.scores.computer;
    document.getElementById('statWins').textContent = totalWins;
    document.getElementById('statLosses').textContent = totalLosses;
    document.getElementById('statDraws').textContent = this.scores.draws;
  },

  /**
   * Update move history display
   */
  updateMoveHistory() {
    const historyList = document.getElementById('moveHistoryList');
    historyList.innerHTML = '';

    this.moveHistory.forEach((move, index) => {
      const moveDiv = document.createElement('div');
      moveDiv.className = `
        p-2 rounded-lg bg-gray-100 dark:bg-gray-700
        text-sm font-medium animate-slide-in
      `;
      moveDiv.textContent = `Move ${index + 1}: ${move.player} → Cell ${move.index + 1}`;
      historyList.appendChild(moveDiv);
    });

    // Scroll to bottom
    historyList.scrollTop = historyList.scrollHeight;
  },

  /**
   * Undo last move (PvP only)
   */
  undoMove() {
    if (this.gameMode !== 'pvp' || this.moveHistory.length === 0) return;

    const lastMove = this.moveHistory.pop();
    this.board = lastMove.board;
    this.currentPlayer = lastMove.player;
    this.gameActive = true;

    this.updateMoveHistory();
    this.renderBoard();
    this.updateStatus();

    // Hide modals if they were shown
    document.getElementById('winModal').classList.add('hidden');
    document.getElementById('drawModal').classList.add('hidden');
  },

  /**
   * Restart current round
   */
  restartRound() {
    // Hide modals
    document.getElementById('winModal').classList.add('hidden');
    document.getElementById('drawModal').classList.add('hidden');

    // Reset game
    this.startGame();
  },

  /**
   * Start a new game (go back to mode selection)
   */
  newGame() {
    // Hide game screen
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('homeScreen').classList.remove('hidden');

    // Hide modals
    document.getElementById('winModal').classList.add('hidden');
    document.getElementById('drawModal').classList.add('hidden');

    // Reset game mode
    this.gameMode = null;
    document.getElementById('difficultySelector').classList.add('hidden');
    document.getElementById('startButtonContainer').classList.add('hidden');

    // Reset game state
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.gameActive = true;
    this.moveHistory = [];
  },

  /**
   * Go back to home screen
   */
  backToHome() {
    this.newGame();
  },

  /**
   * Reset all scores
   */
  resetScores() {
    if (confirm('Are you sure you want to reset all scores?')) {
      this.scores = {
        playerX: 0,
        playerO: 0,
        draws: 0,
        human: 0,
        computer: 0,
      };
      this.saveScores();
      this.updateScoreboard();
    }
  },

  /**
   * Toggle theme
   */
  toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark' || !html.className.includes('dark');

    if (isDark) {
      html.classList.remove('dark');
      html.setAttribute('data-theme', 'light');
      this.currentTheme = 'light';
    } else {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
      this.currentTheme = 'dark';
    }

    this.saveTheme();
  },

  /**
   * Toggle sound
   */
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    const btn = document.getElementById('soundToggle');

    if (this.soundEnabled) {
      btn.classList.remove('opacity-50');
    } else {
      btn.classList.add('opacity-50');
    }

    this.saveSettings();
  },

  /**
   * Play sound effect
   */
  playSound(type) {
    if (!this.soundEnabled) return;

    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    let frequency, duration;

    switch (type) {
      case 'move':
        frequency = 400;
        duration = 0.1;
        break;
      case 'win':
        frequency = 800;
        duration = 0.3;
        break;
      default:
        frequency = 400;
        duration = 0.1;
    }

    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  },

  /**
   * Save scores to LocalStorage
   */
  saveScores() {
    localStorage.setItem('ticTacToeScores', JSON.stringify(this.scores));
  },

  /**
   * Load scores from LocalStorage
   */
  loadScores() {
    const saved = localStorage.getItem('ticTacToeScores');
    if (saved) {
      this.scores = JSON.parse(saved);
    }
  },

  /**
   * Save theme preference
   */
  saveTheme() {
    localStorage.setItem('ticTacToeTheme', this.currentTheme);
  },

  /**
   * Load theme preference
   */
  loadTheme() {
    const saved = localStorage.getItem('ticTacToeTheme') || 'light';
    this.currentTheme = saved;

    const html = document.documentElement;
    if (saved === 'dark') {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
    } else {
      html.classList.remove('dark');
      html.setAttribute('data-theme', 'light');
    }
  },

  /**
   * Save settings
   */
  saveSettings() {
    localStorage.setItem('ticTacToeSettings', JSON.stringify({
      soundEnabled: this.soundEnabled,
    }));
  },

  /**
   * Load settings
   */
  loadSettings() {
    const saved = localStorage.getItem('ticTacToeSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      this.soundEnabled = settings.soundEnabled !== false;
    }

    // Update UI
    const btn = document.getElementById('soundToggle');
    if (!this.soundEnabled) {
      btn.classList.add('opacity-50');
    }
  },
};

// ==========================================
// INITIALIZE APPLICATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
