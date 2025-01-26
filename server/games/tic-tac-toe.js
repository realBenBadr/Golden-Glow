class TicTacToeGame {
    constructor(gameId, players) {
        this.gameId = gameId;
        this.players = players;
        this.board = Array(9).fill(null);
        this.currentTurn = 0;
        this.winner = null;
        this.isDraw = false;
    }

    makeMove(playerId, index) {
        // Validate move
        if (
            this.winner || 
            this.isDraw || 
            playerId !== this.players[this.currentTurn] ||
            index < 0 || 
            index > 8 || 
            this.board[index] !== null
        ) {
            return false;
        }

        // Make move
        this.board[index] = this.currentTurn === 0 ? 'X' : 'O';

        // Check for winner
        if (this.checkWinner()) {
            this.winner = playerId;
        } 
        // Check for draw
        else if (this.board.every(cell => cell !== null)) {
            this.isDraw = true;
        }
        // Switch turns
        else {
            this.currentTurn = this.currentTurn === 0 ? 1 : 0;
        }

        return true;
    }

    checkWinner() {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        return lines.some(([a, b, c]) => {
            return this.board[a] && 
                   this.board[a] === this.board[b] && 
                   this.board[a] === this.board[c];
        });
    }

    getState() {
        return {
            gameId: this.gameId,
            players: this.players,
            board: this.board,
            currentTurn: this.currentTurn,
            winner: this.winner,
            isDraw: this.isDraw
        };
    }
}

module.exports = TicTacToeGame; 