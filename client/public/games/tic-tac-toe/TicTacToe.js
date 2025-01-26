import MultiplayerGame from '../../js/MultiplayerGame.js';

export default class TicTacToe extends MultiplayerGame {
    constructor(containerId) {
        super(containerId, 'tic-tac-toe');
        this.board = Array(9).fill(null);
        this.createBoard();
        this.findMatch();
    }

    createBoard() {
        this.gameArea.innerHTML = '';
        this.gameArea.className = 'tic-tac-toe-board';
        
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            cell.addEventListener('click', () => this.handleCellClick(i));
            this.gameArea.appendChild(cell);
        }

        // Add styles if not already present
        if (!document.querySelector('#tic-tac-toe-styles')) {
            const styles = document.createElement('style');
            styles.id = 'tic-tac-toe-styles';
            styles.textContent = `
                .game-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                }

                .tic-tac-toe-board {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: min(2vw, 10px);
                    background: var(--mystical-blue);
                    padding: min(3vw, 15px);
                    border-radius: min(3vw, 15px);
                    width: min(95vw, 500px);
                    height: min(95vw, 500px);
                    margin: 0 auto;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                    border: 2px solid var(--ornament-color);
                }
                .cell {
                    aspect-ratio: 1;
                    background: var(--persian-pattern),
                                rgba(255, 255, 255, 0.95);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: clamp(2rem, 15vw, 6rem);
                    font-weight: bold;
                    cursor: pointer;
                    border-radius: min(2vw, 8px);
                    transition: all 0.3s ease;
                    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
                }
                .cell:hover {
                    background: rgba(255, 255, 255, 1);
                    transform: scale(0.98);
                }
                .cell.x {
                    color: #e74c3c;
                }
                .cell.o {
                    color: #3498db;
                }
                .waiting-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    z-index: 1000;
                }
                .waiting-screen.hidden {
                    display: none;
                }
                .loader {
                    border: 5px solid #f3f3f3;
                    border-top: 5px solid #3498db;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    animation: spin 1s linear infinite;
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
                    .cell {
                        font-size: clamp(2rem, 15vh, 6rem);
                    }
                }

                /* Small screens */
                @media screen and (max-width: 480px) {
                    .tic-tac-toe-board {
                        gap: 6px;
                        padding: 10px;
                    }
                    .cell {
                        font-size: clamp(2rem, 20vw, 4rem);
                    }
                }
            `;
            document.head.appendChild(styles);
        }
    }

    handleCellClick(index) {
        if (!this.isMyTurn || this.board[index] !== null) return;

        this.makeMove({ index });
    }

    onMatchFound() {
        this.updateStatus(this.isMyTurn ? 'Your turn (X)' : "Opponent's turn (O)");
    }

    onGameStateUpdate(state) {
        this.board = state.board;
        this.isMyTurn = state.currentTurn === (this.playerId === state.players[0] ? 0 : 1);
        this.updateBoard();
        
        if (state.winner) {
            this.updateStatus(state.winner === this.playerId ? 'You won!' : 'Opponent won!');
        } else if (state.isDraw) {
            this.updateStatus("It's a draw!");
        } else {
            this.updateStatus(this.isMyTurn ? 'Your turn' : "Opponent's turn");
        }
    }

    updateBoard() {
        const cells = this.gameArea.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            const value = this.board[index];
            cell.textContent = value;
            cell.className = 'cell' + (value ? ` ${value.toLowerCase()}` : '');
        });
    }
} 