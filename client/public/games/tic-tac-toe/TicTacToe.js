import MultiplayerGame from '../../js/MultiplayerGame.js';

export default class TicTacToe extends MultiplayerGame {
    constructor(containerId) {
        super(containerId, 'tic-tac-toe');
        this.board = Array(9).fill(null);
        this.gameMetrics = {
            playerWins: 0,
            opponentWins: 0,
            draws: 0
        };
        this.moveHistory = [];
        this.winningCombination = null;
        this.svgLoaded = {
            x: false,
            o: false
        };
        
        // Hide the parent class status display
        if (this.statusDisplay) {
            this.statusDisplay.style.display = 'none';
        }
        
        this.createGameInterface();
        this.showWaitingScreen(); // Show waiting screen when initializing
        this.findMatch();
        this.checkSvgAvailability();
    }

    // Add a method to check if SVG files load correctly
    checkSvgAvailability() {
        // Check if X symbol SVG is available (Persian cross artifact)
        const xSymbolImg = new Image();
        xSymbolImg.onload = () => { this.svgLoaded.x = true; };
        xSymbolImg.onerror = () => { 
            console.log('Persian X symbol SVG failed to load, using fallback'); 
            this.svgLoaded.x = false;
            this.applySvgFallbacks();
        };
        xSymbolImg.src = '../../assets/symbols/faravahar-symbol.svg';
        
        // Check if O symbol SVG is available (Persian circular seal)
        const oSymbolImg = new Image();
        oSymbolImg.onload = () => { this.svgLoaded.o = true; };
        oSymbolImg.onerror = () => { 
            console.log('Persian O symbol SVG failed to load, using fallback'); 
            this.svgLoaded.o = false;
            this.applySvgFallbacks();
        };
        oSymbolImg.src = '../../assets/symbols/achaemenid-symbol.svg';
        
        // Create these SVGs if they don't exist yet
        this.createFallbackSVGs();
    }
    
    createFallbackSVGs() {
        // Create SVG elements and add them to the DOM if they don't exist
        // This ensures we always have a visual even if external SVGs fail to load
        if (!document.getElementById('persian-cross-symbol')) {
            const crossSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            crossSVG.setAttribute('id', 'persian-cross-symbol');
            crossSVG.setAttribute('viewBox', '0 0 100 100');
            crossSVG.setAttribute('width', '0');
            crossSVG.setAttribute('height', '0');
            crossSVG.innerHTML = `
                <symbol id="persian-cross" viewBox="0 0 100 100">
                    <!-- Faravahar (Zoroastrian Guardian Symbol) -->
                    <path fill="#e74c3c" d="M50,5 C42,5 35,12 35,20 C35,28 42,35 50,35 C58,35 65,28 65,20 C65,12 58,5 50,5 Z" />
                    <path stroke="#e74c3c" stroke-width="3" d="M50,35 L50,65 M35,45 L65,45" />
                    <path stroke="#e74c3c" stroke-width="3" fill="none" d="M30,35 C20,45 20,65 30,75 C35,80 40,80 45,75 C50,70 50,60 45,55 C40,50 35,50 30,55" />
                    <path stroke="#e74c3c" stroke-width="3" fill="none" d="M70,35 C80,45 80,65 70,75 C65,80 60,80 55,75 C50,70 50,60 55,55 C60,50 65,50 70,55" />
                    <path stroke="#e74c3c" stroke-width="3" d="M20,50 L80,50" />
                    <path stroke="#e74c3c" stroke-width="2" d="M25,65 L35,75 M75,65 L65,75" />
                    <path stroke="#e74c3c" stroke-width="3" d="M50,65 L40,85 M50,65 L60,85" />
                </symbol>
            `;
            document.body.appendChild(crossSVG);
        }
        
        if (!document.getElementById('persian-seal-symbol')) {
            const sealSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            sealSVG.setAttribute('id', 'persian-seal-symbol');
            sealSVG.setAttribute('viewBox', '0 0 100 100');
            sealSVG.setAttribute('width', '0');
            sealSVG.setAttribute('height', '0');
            sealSVG.innerHTML = `
                <symbol id="persian-seal" viewBox="0 0 100 100">
                    <!-- Achaemenid Royal Seal Symbol -->
                    <circle cx="50" cy="50" r="35" fill="none" stroke="#3498db" stroke-width="3"/>
                    <circle cx="50" cy="50" r="25" fill="none" stroke="#3498db" stroke-width="2"/>
                    <path fill="#3498db" d="M50,15 L53,25 L63,25 L55,31 L58,41 L50,35 L42,41 L45,31 L37,25 L47,25 Z" />
                    <path fill="#3498db" d="M50,85 L47,75 L37,75 L45,69 L42,59 L50,65 L58,59 L55,69 L63,75 L53,75 Z" />
                    <path fill="#3498db" d="M15,50 L25,47 L25,37 L31,45 L41,42 L35,50 L41,58 L31,55 L25,63 L25,53 Z" />
                    <path fill="#3498db" d="M85,50 L75,53 L75,63 L69,55 L59,58 L65,50 L59,42 L69,45 L75,37 L75,47 Z" />
                </symbol>
            `;
            document.body.appendChild(sealSVG);
        }
    }
    
    applySvgFallbacks() {
        // Apply fallbacks to any existing cells
        const cells = this.board_element.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            const value = this.board[index];
            if (value) {
                if ((value.toLowerCase() === 'x' && !this.svgLoaded.x) || 
                    (value.toLowerCase() === 'o' && !this.svgLoaded.o)) {
                    cell.classList.add('svg-inline');
                    // Remove svg-fallback class if it was previously applied
                    cell.classList.remove('svg-fallback');
                    cell.textContent = '';
                }
            }
        });
        
        // Force refresh of styles to ensure fallbacks are immediately visible
        document.body.classList.add('force-repaint');
        setTimeout(() => {
            document.body.classList.remove('force-repaint');
        }, 10);
    }

    createGameInterface() {
        // Create a proper game UI with components
        this.gameArea.innerHTML = '';
        this.gameArea.className = 'tic-tac-toe-game-container';
        
        // Change the container's class
        this.container.classList.add('full-page-container');
        
        this.gameArea.innerHTML = `
            <div class="game-header">
                <h1 class="game-title">Marks of Destiny</h1>
            </div>
            <div class="game-header-stats-container">
                <div class="game-stats persian-style">
                    <div class="player-score">You: <span>0</span></div>
                    <div class="match-info">Round 1</div>
                    <div class="opponent-score">Opponent: <span>0</span></div>
                </div>
            </div>
            <div class="tic-tac-toe-board"></div>
            <div class="game-status-container">
                <div class="game-status">Waiting for opponent...</div>
            </div>
            <div class="game-actions">
                <button class="persian-button rematch-btn">Play Again</button>
                <button class="persian-button menu-btn">Return to Menu</button>
            </div>
            <div class="waiting-screen">
                <div class="loader"></div>
                <p class="waiting-text">Waiting for opponent...</p>
                <button class="persian-button waiting-menu-btn">Return to Menu</button>
            </div>
        `;
        
        this.board_element = this.gameArea.querySelector('.tic-tac-toe-board');
        this.statusElement = this.gameArea.querySelector('.game-status');
        this.waitingScreen = this.gameArea.querySelector('.waiting-screen');
        this.createBoard();
        
        // Event listeners - improved with better references and error handling
        const rematchBtn = this.gameArea.querySelector('.rematch-btn');
        const menuBtn = this.gameArea.querySelector('.menu-btn');
        const waitingMenuBtn = this.gameArea.querySelector('.waiting-menu-btn');
        
        if (rematchBtn) {
            rematchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Rematch button clicked');
                this.requestRematch();
            });
        }
        
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Menu button clicked');
                window.location.href = '/';
            });
        }
        
        if (waitingMenuBtn) {
            waitingMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Waiting screen menu button clicked');
                window.location.href = '/';
            });
        }
        
        this.loadSounds();
        this.addStyles();
    }

    loadSounds() {
        // Preload game sounds
        this.sounds = {
            place: new Audio('../../assets/sounds/place.mp3'),
            win: new Audio('../../assets/sounds/win.mp3'),
            lose: new Audio('../../assets/sounds/lose.mp3'),
            draw: new Audio('../../assets/sounds/draw.mp3')
        };
        
        // Fallback if sounds don't exist
        for (const [key, sound] of Object.entries(this.sounds)) {
            sound.onerror = () => {
                console.log(`Sound ${key} couldn't be loaded`);
                // Create empty audio to prevent errors
                this.sounds[key] = { play: () => {} };
            };
        }
    }

    createBoard() {
        this.board_element.innerHTML = '';
        
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            cell.addEventListener('click', () => this.handleCellClick(i));
            this.board_element.appendChild(cell);
        }
    }

    handleCellClick(index) {
        if (!this.isMyTurn || this.board[index] !== null) return;

        // Play sound effect
        this.sounds.place.play();
        
        // Add to move history
        this.moveHistory.push({
            player: this.playerId,
            position: index,
            timestamp: Date.now()
        });
        
        this.makeMove({ index });
    }

    onMatchFound() {
        this.hideWaitingScreen(); // Hide waiting screen when match is found
        this.updateStatus(this.isMyTurn ? 'Your turn (X)' : "Opponent's turn (O)");
        this.updateGameBoardState();
    }

    onGameStateUpdate(state) {
        this.board = state.board;
        this.isMyTurn = state.currentTurn === (this.playerId === state.players[0] ? 0 : 1);
        this.updateBoard();
        this.updateGameBoardState();
        
        if (state.winner) {
            this.winningCombination = this.findWinningCombination();
            
            if (state.winner === this.playerId) {
                this.sounds.win.play();
                this.gameMetrics.playerWins++;
                this.updateStatus('You won!');
            } else {
                this.sounds.lose.play();
                this.gameMetrics.opponentWins++;
                this.updateStatus('Opponent won!');
            }
            
            if (this.winningCombination) {
                this.highlightWinningCells(this.winningCombination);
            }
            
            this.showRematchButton();
        } else if (state.isDraw) {
            this.sounds.draw.play();
            this.gameMetrics.draws++;
            this.updateStatus("It's a draw!");
            this.showRematchButton();
        } else {
            this.updateStatus(this.isMyTurn ? 'Your turn' : "Opponent's turn");
        }
        
        this.updateScores();
    }

    updateGameBoardState() {
        // Add visual indicator for current turn
        this.board_element.classList.remove('player-x-turn', 'player-o-turn');
        
        if (!this.winningCombination && !this.isDraw) {
            const turnClass = this.isMyTurn ? 'player-x-turn' : 'player-o-turn';
            this.board_element.classList.add(turnClass);
        }
    }
    
    updateScores() {
        const playerScoreEl = this.gameArea.querySelector('.player-score span');
        const opponentScoreEl = this.gameArea.querySelector('.opponent-score span');
        
        if (playerScoreEl && opponentScoreEl) {
            playerScoreEl.textContent = this.gameMetrics.playerWins;
            opponentScoreEl.textContent = this.gameMetrics.opponentWins;
        }
        
        const roundNumber = this.gameMetrics.playerWins + this.gameMetrics.opponentWins + this.gameMetrics.draws + 1;
        const matchInfoEl = this.gameArea.querySelector('.match-info');
        if (matchInfoEl) {
            matchInfoEl.textContent = `Round ${roundNumber}`;
        }
    }

    updateBoard() {
        const cells = this.board_element.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            const value = this.board[index];
            
            // Remove previous classes and text content
            cell.classList.remove('x', 'o', 'svg-fallback', 'svg-inline');
            cell.textContent = '';
            
            // Add new class based on value
            if (value) {
                const lowerValue = value.toLowerCase();
                cell.classList.add(lowerValue);
                
                // First try using the external SVG files
                if ((lowerValue === 'x' && !this.svgLoaded.x) || 
                    (lowerValue === 'o' && !this.svgLoaded.o)) {
                    
                    // If external SVGs fail, try using embedded SVG symbols
                    cell.classList.add('svg-inline');
                    
                    // If both approaches fail, use text fallback as a last resort
                    if (!document.getElementById(`persian-${lowerValue === 'x' ? 'cross' : 'seal'}-symbol`)) {
                        cell.classList.remove('svg-inline');
                        cell.classList.add('svg-fallback');
                        cell.textContent = value;
                    }
                }
            }
        });
    }
    
    findWinningCombination() {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];
        
        for (const line of lines) {
            const [a, b, c] = line;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return line;
            }
        }
        
        return null;
    }

    highlightWinningCells(combination) {
        combination.forEach(index => {
            const cell = this.board_element.querySelector(`.cell[data-index="${index}"]`);
            if (cell) {
                cell.classList.add('winning-cell');
            }
        });
    }

    showRematchButton() {
        const rematchBtn = this.gameArea.querySelector('.rematch-btn');
        if (rematchBtn) {
            rematchBtn.classList.remove('hidden');
            // Ensure button is visible and clickable
            rematchBtn.style.display = 'block';
            rematchBtn.style.pointerEvents = 'auto';
            
            // Highlight the button to draw attention
            rematchBtn.style.animation = 'button-pulse 1.5s infinite';
            
            // Add animation if not present
            if (!document.querySelector('#button-animation')) {
                const animStyle = document.createElement('style');
                animStyle.id = 'button-animation';
                animStyle.textContent = `
                    @keyframes button-pulse {
                        0% { transform: scale(1); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3); }
                        50% { transform: scale(1.05); box-shadow: 0 6px 20px rgba(255, 215, 0, 0.6); }
                        100% { transform: scale(1); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3); }
                    }
                `;
                document.head.appendChild(animStyle);
            }
        }
    }
    
    requestRematch() {
        console.log('Requesting rematch...');
        
        // Reset local state
        this.board = Array(9).fill(null);
        this.winningCombination = null;
        this.moveHistory = [];
        
        // Reset board visuals
        const cells = this.board_element.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.className = 'cell';
        });
        
        // Show waiting screen and find a new match
        this.showWaitingScreen();
        this.findMatch();
        
        // Reset UI
        this.updateStatus('Finding opponent...');
    }

    showWaitingScreen() {
        if (this.waitingScreen) {
            this.waitingScreen.classList.remove('hidden');
        }
    }
    
    hideWaitingScreen() {
        if (this.waitingScreen) {
            this.waitingScreen.classList.add('hidden');
        }
    }

    addStyles() {
        // Add styles if not already present
        if (!document.querySelector('#tic-tac-toe-styles')) {
            const styles = document.createElement('style');
            styles.id = 'tic-tac-toe-styles';
            styles.textContent = `
                /* Full page styling */
                .full-page-container {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                    background-image: url('../../assets/animations/ttt back.webp') !important;
                    background-size: cover !important;
                    background-position: center !important;
                    background-repeat: no-repeat !important;
                    z-index: 9999 !important;
                }
                
                .game-title {
                    color: var(--primary-gold, #ffd700);
                    font-family: 'Cinzel', serif;
                    text-align: center;
                    margin-top: 15px;
                    margin-bottom: 0;
                    text-shadow: 0 0 10px rgba(255, 215, 0, 0.7);
                    font-size: 1.8rem;
                }

                .tic-tac-toe-game-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 1rem;
                    padding: 0;
                    width: 100%;
                    max-width: 100%;
                    height: 100%;
                    position: relative;
                }
                
                /* For very small mobile screens */
                @media screen and (max-width: 360px) {
                    .game-title {
                        font-size: 1.2rem;
                        margin: 5px 0;
                    }
                    
                    .game-stats {
                        padding: 0.4rem 0.8rem;
                        font-size: 0.8rem;
                        margin-top: 10px;
                    }
                    
                    .tic-tac-toe-board {
                        gap: 5px;
                        padding: 8px;
                    }
                    
                    .cell {
                        width: 65px;
                        height: 65px;
                    }
                }
                
                .game-header-stats-container {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 0.5rem;
                    margin-top: 0; /* Changed from -90px to fix title visibility */
                }
                
                /* Add specific styles for the game header */
                .game-header {
                    width: 100%;
                    text-align: center;
                    margin-bottom: 10px;
                    padding: 10px 0;
                    z-index: 10;
                }
                
                .game-stats {
                    display: flex;
                    justify-content: space-between;
                    width: 100%;
                    max-width: 500px;
                    background: rgba(26, 35, 126, 0.7);
                    padding: 0.8rem 1.5rem;
                    border-radius: 15px;
                    color: #fff;
                    font-family: 'Cinzel', serif;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    border: 2px solid var(--ornament-color);
                    text-align: center;
                    margin-top: 50px; /* Changed from 0px to 50px as requested */
                    position: relative;
                    z-index: 5; /* Ensure it's above other elements */
                    backdrop-filter: blur(3px);
                }
                
                .game-status-container {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    margin-top: 0px;
                    margin-bottom: 20px;
                    position: relative;
                    z-index: 1000; /* Extremely high z-index to ensure container is above all elements */
                }
                
                .game-status {
                    font-family: 'Cinzel', serif;
                    color: #ffd700;
                    text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
                    font-size: 1.2rem;
                    font-weight: bold;
                    text-align: center;
                    padding: 0.5rem 1rem;
                    background: rgba(26, 35, 126, 0.5);
                    border-radius: 10px;
                    border: 1px solid var(--ornament-color, #c9a55f);
                }
                
                .player-score, .opponent-score {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-width: 80px;
                }
                
                .player-score span, .opponent-score span {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: var(--primary-gold, #ffd700);
                    text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
                }
                
                .match-info {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    color: var(--primary-gold, #ffd700);
                    flex-grow: 1;
                }

                .tic-tac-toe-board {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: min(2vw, 10px);
                    background-image: url('../../assets/persian-pattern.svg'), linear-gradient(to bottom right, rgba(26, 35, 126, 0.7), rgba(13, 19, 51, 0.7));
                    background-blend-mode: overlay;
                    padding: min(3vw, 15px);
                    border-radius: min(3vw, 15px);
                    width: min(85vw, 400px);  /* Reduced from 95vw/500px to 85vw/400px */
                    height: min(85vw, 400px); /* Reduced from 95vw/500px to 85vw/400px */
                    margin: 0 auto;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    border: 2px solid var(--ornament-color);
                    transition: all 0.3s ease;
                    align-self: center;
                    margin-top: 0px; /* Increased from 5px to 15px for better spacing */
                    backdrop-filter: blur(2px);
                }
                
                /* Fix game container in game screen */
                .game-screen {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start; /* Changed to align from top */
                    width: 100%;
                    height: 100%;
                    position: relative;
                    padding-top: 10px; /* Added padding at top */
                }
                
                .game-area {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start; /* Changed to align from top */
                    width: 100%;
                    height: calc(100% - 60px);
                    padding-top: 10px; /* Added padding at top */
                }
                
                /* Game header connection */
                .game-header + .game-area .tic-tac-toe-game-container {
                    margin-top: -15px;
                }
                
                .tic-tac-toe-board.player-x-turn {
                    border: 3px solid #e74c3c;
                    box-shadow: 0 0 15px rgba(231, 76, 60, 0.5);
                }
                
                .tic-tac-toe-board.player-o-turn {
                    border: 3px solid #3498db;
                    box-shadow: 0 0 15px rgba(52, 152, 219, 0.5);
                }
                
                .cell {
                    aspect-ratio: 1;
                    background: rgba(255, 255, 255, 0.95);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    border-radius: min(2vw, 8px);
                    transition: all 0.3s ease;
                    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
                    position: relative;
                }
                
                .cell:hover {
                    background: rgba(255, 255, 255, 1);
                    transform: scale(0.98);
                }
                
                .cell.x::after, .cell.o::after {
                    content: "";
                    position: absolute;
                    width: 80%;
                    height: 80%;
                    background-size: contain;
                    background-position: center;
                    background-repeat: no-repeat;
                    animation: place-mark 0.4s ease-out forwards;
                }
                
                .cell.x::after {
                    background-image: url('../../assets/symbols/faravahar-symbol.svg');
                    filter: drop-shadow(0 0 5px rgba(231, 76, 60, 0.7));
                }
                
                .cell.o::after {
                    background-image: url('../../assets/symbols/achaemenid-symbol.svg');
                    filter: drop-shadow(0 0 5px rgba(52, 152, 219, 0.7));
                }
                
                /* Inline SVG fallbacks if external SVGs fail to load */
                .cell.x.svg-inline::after {
                    background-image: none;
                    background-color: transparent;
                }
                
                .cell.x.svg-inline::before {
                    content: "";
                    position: absolute;
                    top: 10%;
                    left: 10%;
                    width: 80%;
                    height: 80%;
                    background-image: url('../../assets/symbols/faravahar-symbol.svg');
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                    animation: place-mark 0.4s ease-out forwards;
                }
                
                .cell.o.svg-inline::after {
                    background-image: none;
                    background-color: transparent;
                }
                
                .cell.o.svg-inline::before {
                    content: "";
                    position: absolute;
                    top: 10%;
                    left: 10%;
                    width: 80%;
                    height: 80%;
                    background-image: url('../../assets/symbols/achaemenid-symbol.svg');
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                    animation: place-mark 0.4s ease-out forwards;
                }
                
                /* Fallback if SVGs are not available */
                .cell.x.svg-fallback {
                    color: #e74c3c;
                    font-size: clamp(2rem, 15vw, 6rem);
                    font-weight: bold;
                    text-shadow: 0 0 10px rgba(231, 76, 60, 0.5);
                    font-family: 'Cinzel', serif;
                }
                
                .cell.o.svg-fallback {
                    color: #3498db;
                    font-size: clamp(2rem, 15vw, 6rem);
                    font-weight: bold;
                    text-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
                    font-family: 'Cinzel', serif;
                }
                
                @keyframes place-mark {
                    0% { transform: scale(0); opacity: 0; }
                    70% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                
                @keyframes winner-pulse {
                    0% { transform: scale(1); box-shadow: 0 0 5px gold; }
                    50% { transform: scale(1.05); box-shadow: 0 0 20px gold; }
                    100% { transform: scale(1); box-shadow: 0 0 5px gold; }
                }
                
                .winning-cell {
                    animation: winner-pulse 1.5s infinite;
                    background: linear-gradient(45deg, rgba(255,215,0,0.3), rgba(255,255,255,0.9));
                }
                
                .game-actions {
                    position: absolute;
                    bottom: 20px; /* Changed from 10% to fixed 20px from bottom */
                    left: 0;
                    right: 0;
                    display: flex;
                    gap: 0.7rem; /* Reduced gap between buttons */
                    justify-content: center;
                    width: 100%;
                    z-index: 1000;
                }
                
                .rematch-btn, .menu-btn {
                    padding: 0.4rem 0.8rem; /* Reduced padding for smaller buttons */
                    background: linear-gradient(45deg, #ffd700, #ff8c00);
                    color: white;
                    border: 1px solid #fff; /* Thinner border */
                    border-radius: 15px; /* Smaller border radius */
                    font-family: 'Cinzel', serif;
                    font-size: 0.85rem; /* Smaller font size */
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3); /* Smaller shadow */
                    z-index: 1001;
                    position: relative;
                    outline: none;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
                }
                
                .rematch-btn:hover, .menu-btn:hover {
                    transform: translateY(-2px) scale(1.03); /* Reduced hover effect */
                    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.5); /* Smaller hover shadow */
                }
                
                .rematch-btn:active, .menu-btn:active {
                    transform: translateY(1px);
                    box-shadow: 0 1px 5px rgba(255, 215, 0, 0.4); /* Even smaller active shadow */
                }
                
                .menu-btn {
                    background: linear-gradient(45deg, #3498db, #9b59b6);
                }
                
                .menu-btn:hover {
                    background: linear-gradient(45deg, #2980b9, #8e44ad);
                    box-shadow: 0 6px 20px rgba(52, 152, 219, 0.6);
                }
                
                .hidden {
                    display: none !important;
                }
                
                .waiting-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.85);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    z-index: 2000;
                }
                
                .waiting-screen.hidden {
                    display: none;
                }
                
                .waiting-text {
                    font-family: 'Cinzel', serif;
                    font-size: 1.5rem;
                    color: var(--primary-gold, #ffd700);
                    text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
                    margin: 1rem 0 2rem 0;
                    text-align: center;
                }
                
                .waiting-menu-btn {
                    padding: 0.5rem 1.2rem;
                    background: linear-gradient(45deg, #3498db, #9b59b6);
                    color: white;
                    border: 1px solid #fff;
                    border-radius: 15px;
                    font-family: 'Cinzel', serif;
                    font-size: 0.9rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                    z-index: 2001;
                    position: relative;
                    outline: none;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
                    margin-top: 1rem;
                }
                
                .waiting-menu-btn:hover {
                    transform: translateY(-2px) scale(1.03);
                    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.5);
                    background: linear-gradient(45deg, #2980b9, #8e44ad);
                }
                
                .waiting-menu-btn:active {
                    transform: translateY(1px);
                    box-shadow: 0 1px 5px rgba(52, 152, 219, 0.4);
                }
                
                .loader {
                    border: 5px solid rgba(255, 255, 255, 0.2);
                    border-top: 5px solid var(--primary-gold, #ffd700);
                    border-radius: 50%;
                    width: 60px;
                    height: 60px;
                    animation: spin 1.5s linear infinite;
                    margin-bottom: 20px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                /* Landscape Mode */
                @media screen and (orientation: landscape) and (max-height: 600px) {
                    .tic-tac-toe-board {
                        width: min(90vh, 500px);
                        height: min(90vh, 500px);
                    }
                    
                    .tic-tac-toe-game-container {
                        padding: 0.5rem;
                        gap: 0.5rem;
                    }
                }

                /* Small screens */
                @media screen and (max-width: 480px) {
                    .tic-tac-toe-board {
                        gap: 6px;
                        padding: 10px;
                        margin-top: 5px;  /* Add a small margin at the top */
                        max-width: 90vw;  /* Limit width on small screens */
                        max-height: 50vh; /* Limit height on small screens */
                    }
                    
                    .game-stats {
                        padding: 0.5rem 1rem;
                        font-size: 0.9rem;
                        margin-top: -40px; /* Changed from 20px to -40px as requested */
                    }
                    
                    .player-score span, .opponent-score span {
                        font-size: 1.2rem;
                    }
                    
                    .match-info {
                        font-size: 1rem;
                    }
                    
                    .game-title {
                        font-size: 1.4rem;
                        margin-top: 10px;
                        visibility: visible !important;
                        display: block !important;
                    }
                    
                    .game-header {
                        margin-bottom: 5px;
                        padding: 5px 0;
                        visibility: visible !important;
                        display: block !important;
                    }
                    
                    .game-status-container {
                        margin: 10px 0;
                    }
                    
                    .game-actions {
                        bottom: 15px; /* Even closer to bottom on small screens */
                    }
                    
                    .rematch-btn, .menu-btn {
                        padding: 0.3rem 0.6rem; /* Even smaller on mobile */
                        font-size: 0.75rem;
                    }

                    /* Ensure the cell SVG icons fit properly */
                    .cell svg {
                        width: 80%;
                        height: 80%;
                    }
                    
                    .game-status {
                        font-size: 1rem;
                        padding: 0.4rem 0.8rem;
                        width: 90%;
                        margin: 0 auto;
                    }
                }
                
                /* For TG Mini Apps on mobile - ensure buttons are visible at the bottom */
                @media screen and (max-height: 700px) {
                    .game-actions {
                        bottom: 10px;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
    }

    // Override the parent class updateStatus method
    updateStatus(message) {
        if (this.statusElement) {
            this.statusElement.textContent = message;
        }
        // Don't call super.updateStatus() to avoid updating the parent's status element
        // We're completely replacing the parent's status display with our own
    }
} 