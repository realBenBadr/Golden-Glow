import { io } from 'https://cdn.socket.io/4.7.4/socket.io.esm.min.js';

export default class MultiplayerGame {
    constructor(containerId, gameType) {
        this.container = document.getElementById(containerId);
        this.gameType = gameType;
        this.gameId = null;
        this.isMyTurn = false;
        this.playerId = null;
        this.opponentId = null;

        // Initialize Socket.IO
        this.socket = io(window.location.origin);
        this.setupSocketListeners();
        
        // UI elements
        this.setupUI();
    }

    setupUI() {
        // Create status display
        this.statusDisplay = document.createElement('div');
        this.statusDisplay.className = 'game-status';
        this.container.appendChild(this.statusDisplay);

        // Create game area
        this.gameArea = document.createElement('div');
        this.gameArea.className = 'game-area';
        this.container.appendChild(this.gameArea);

        // Create waiting screen
        this.waitingScreen = document.createElement('div');
        this.waitingScreen.className = 'waiting-screen hidden';
        this.waitingScreen.innerHTML = `
            <div class="loader"></div>
            <p>Waiting for opponent...</p>
        `;
        this.container.appendChild(this.waitingScreen);
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            this.playerId = this.socket.id;
            console.log('Connected to server with ID:', this.playerId);
        });

        this.socket.on('waitingForMatch', () => {
            this.showWaitingScreen();
        });

        this.socket.on('matchFound', ({ gameId, opponent, isFirstPlayer }) => {
            this.gameId = gameId;
            this.opponentId = opponent;
            this.isMyTurn = isFirstPlayer;
            this.hideWaitingScreen();
            this.onMatchFound();
        });

        this.socket.on('gameStateUpdate', ({ gameId, state }) => {
            if (this.gameId === gameId) {
                this.onGameStateUpdate(state);
            }
        });

        this.socket.on('opponentDisconnected', ({ gameId }) => {
            if (this.gameId === gameId) {
                this.handleOpponentDisconnect();
            }
        });
    }

    findMatch() {
        this.socket.emit('findMatch', { gameType: this.gameType });
    }

    makeMove(action) {
        if (!this.isMyTurn || !this.gameId) return;
        
        this.socket.emit('gameAction', {
            gameId: this.gameId,
            action
        });
    }

    showWaitingScreen() {
        this.waitingScreen.classList.remove('hidden');
        this.gameArea.classList.add('hidden');
    }

    hideWaitingScreen() {
        this.waitingScreen.classList.add('hidden');
        this.gameArea.classList.remove('hidden');
    }

    updateStatus(message) {
        this.statusDisplay.textContent = message;
    }

    // Methods to be implemented by child classes
    onMatchFound() {
        throw new Error('onMatchFound must be implemented by child class');
    }

    onGameStateUpdate(state) {
        throw new Error('onGameStateUpdate must be implemented by child class');
    }

    handleOpponentDisconnect() {
        this.updateStatus('Opponent disconnected');
        // Additional cleanup as needed
    }

    cleanup() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
} 