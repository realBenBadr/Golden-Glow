export default class Path2048 {
    constructor(container) {
        this.container = document.getElementById(container);
        if (!this.container) {
            throw new Error(`Container with id '${container}' not found`);
        }
        this.size = 4;
        this.grid = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('bestScore') || 0;
        this.gameOver = false;
        this.won = false;
        
        // Initialize the game container with HTML structure
        this.container.innerHTML = `
            <div class="game-2048">
                <div class="game-header">
                    <div class="game-title">Path of Enlightenment</div>
                    <div class="scores-container">
                        <div class="score">Score: <span id="score">0</span></div>
                        <div class="best-score">Best: <span id="bestScore">0</span></div>
                    </div>
                    <div class="restart-button">New Game</div>
                </div>
                <div class="grid-container"></div>
                <div class="game-message">
                    <p></p>
                    <div class="retry-button">Try again</div>
                </div>
            </div>
        `;
        
        // Initialize elements
        this.messageContainer = this.container.querySelector('.game-message');
        this.gridContainer = this.container.querySelector('.grid-container');
        this.scoreDisplay = this.container.querySelector('#score');
        this.bestScoreDisplay = this.container.querySelector('#bestScore');
        
        // Hide message initially
        this.messageContainer.style.display = 'none';
        
        // Initialize grid cells
        this.initializeGrid();
        
        this.init();

        // Add swipe threshold
        this.SWIPE_THRESHOLD = 50;
        this.touchStartX = null;
        this.touchStartY = null;
        
        // Setup responsive layout handlers
        this.setupResponsiveLayout();
        window.addEventListener('resize', () => this.setupResponsiveLayout());
    }

    setupResponsiveLayout() {
        const isLandscape = window.innerWidth > window.innerHeight;
        const isMobile = window.innerWidth <= 480;
        
        // Calculate the optimal grid size based on viewport
        let gridSize;
        if (isLandscape) {
            if (window.innerHeight <= 600) {
                gridSize = Math.min(window.innerHeight * 0.9, 500);
            } else {
                gridSize = Math.min(window.innerHeight * 0.7, 500);
            }
        } else {
            if (isMobile) {
                gridSize = Math.min(window.innerWidth * 0.95, window.innerHeight * 0.5);
            } else {
                gridSize = Math.min(window.innerWidth * 0.8, window.innerHeight * 0.5, 500);
            }
        }
        
        // Calculate font sizes
        const baseFontSize = Math.max(
            16,
            Math.min(
                Math.floor(gridSize / 8),
                isMobile ? 24 : 32
            )
        );
        
        // Update CSS variables
        document.documentElement.style.setProperty('--tile-font-size', `${baseFontSize}px`);
        document.documentElement.style.setProperty('--grid-size', `${gridSize}px`);
        
        // Update container sizes
        this.container.style.width = isLandscape ? '95vw' : `${Math.min(gridSize * 1.2, 500)}px`;
        this.gridContainer.style.width = `${gridSize}px`;
        this.gridContainer.style.height = `${gridSize}px`;
    }

    initializeGrid() {
        this.gridContainer.innerHTML = '';
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                this.gridContainer.appendChild(cell);
            }
        }
    }

    init() {
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.addRandomTile();
        this.addRandomTile();
        this.updateView();
        this.setupEventListeners();
        this.hideMessage(); // Hide the message on game start
    }

    addRandomTile() {
        const emptyCells = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({x: i, y: j});
                }
            }
        }

        if (emptyCells.length) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[randomCell.x][randomCell.y] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    move(direction) {
        if (this.gameOver) return;

        const previousGrid = JSON.stringify(this.grid);
        let moved = false;

        switch(direction) {
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
        }

        if (moved) {
            this.addRandomTile();
            this.updateView();
            
            if (this.checkWin()) {
                this.won = true;
                this.showMessage('You Win!');
            } else if (this.checkLose()) {
                this.gameOver = true;
                this.showMessage('Game Over!');
            }
        }

        if (moved && window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
    }

    moveLeft() {
        let moved = false;
        for (let i = 0; i < this.size; i++) {
            let row = this.grid[i].filter(cell => cell !== 0);
            for (let j = 0; j < row.length - 1; j++) {
                if (row[j] === row[j + 1]) {
                    row[j] *= 2;
                    this.score += row[j];
                    row.splice(j + 1, 1);
                    moved = true;
                }
            }
            const newRow = row.concat(Array(this.size - row.length).fill(0));
            if (JSON.stringify(this.grid[i]) !== JSON.stringify(newRow)) moved = true;
            this.grid[i] = newRow;
        }
        return moved;
    }

    moveRight() {
        let moved = false;
        for (let i = 0; i < this.size; i++) {
            let row = this.grid[i].filter(cell => cell !== 0);
            for (let j = row.length - 1; j > 0; j--) {
                if (row[j] === row[j - 1]) {
                    row[j] *= 2;
                    this.score += row[j];
                    row.splice(j - 1, 1);
                    moved = true;
                }
            }
            const newRow = Array(this.size - row.length).fill(0).concat(row);
            if (JSON.stringify(this.grid[i]) !== JSON.stringify(newRow)) moved = true;
            this.grid[i] = newRow;
        }
        return moved;
    }

    moveUp() {
        let moved = false;
        for (let j = 0; j < this.size; j++) {
            let column = [];
            for (let i = 0; i < this.size; i++) {
                if (this.grid[i][j] !== 0) column.push(this.grid[i][j]);
            }
            for (let i = 0; i < column.length - 1; i++) {
                if (column[i] === column[i + 1]) {
                    column[i] *= 2;
                    this.score += column[i];
                    column.splice(i + 1, 1);
                    moved = true;
                }
            }
            column = column.concat(Array(this.size - column.length).fill(0));
            for (let i = 0; i < this.size; i++) {
                if (this.grid[i][j] !== column[i]) moved = true;
                this.grid[i][j] = column[i];
            }
        }
        return moved;
    }

    moveDown() {
        let moved = false;
        for (let j = 0; j < this.size; j++) {
            let column = [];
            for (let i = 0; i < this.size; i++) {
                if (this.grid[i][j] !== 0) column.push(this.grid[i][j]);
            }
            for (let i = column.length - 1; i > 0; i--) {
                if (column[i] === column[i - 1]) {
                    column[i] *= 2;
                    this.score += column[i];
                    column.splice(i - 1, 1);
                    moved = true;
                }
            }
            column = Array(this.size - column.length).fill(0).concat(column);
            for (let i = 0; i < this.size; i++) {
                if (this.grid[i][j] !== column[i]) moved = true;
                this.grid[i][j] = column[i];
            }
        }
        return moved;
    }

    checkWin() {
        return this.grid.some(row => row.some(cell => cell === 2048));
    }

    checkLose() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] === 0) return false;
                if (i < this.size - 1 && this.grid[i][j] === this.grid[i + 1][j]) return false;
                if (j < this.size - 1 && this.grid[i][j] === this.grid[i][j + 1]) return false;
            }
        }
        return true;
    }

    updateView() {
        // Update the grid display
        this.gridContainer.innerHTML = '';
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                
                if (this.grid[i][j] !== 0) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${this.grid[i][j]}`;
                    tile.textContent = this.grid[i][j];
                    cell.appendChild(tile);
                }
                
                this.gridContainer.appendChild(cell);
            }
        }

        // Update scores
        this.scoreDisplay.textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
        }
        this.bestScoreDisplay.textContent = this.bestScore;
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key.startsWith('Arrow')) {
                e.preventDefault();
                switch(e.key) {
                    case 'ArrowUp': this.move('up'); break;
                    case 'ArrowDown': this.move('down'); break;
                    case 'ArrowLeft': this.move('left'); break;
                    case 'ArrowRight': this.move('right'); break;
                }
            }
        });

        // Improved touch support
        this.container.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        this.container.addEventListener('touchmove', (e) => {
            if (!this.touchStartX || !this.touchStartY) return;
            e.preventDefault();
        }, { passive: false });

        this.container.addEventListener('touchend', (e) => {
            if (!this.touchStartX || !this.touchStartY) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - this.touchStartX;
            const dy = touchEndY - this.touchStartY;
            
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > this.SWIPE_THRESHOLD) {
                this.move(dx > 0 ? 'right' : 'left');
            } else if (Math.abs(dy) > this.SWIPE_THRESHOLD) {
                this.move(dy > 0 ? 'down' : 'up');
            }

            this.touchStartX = null;
            this.touchStartY = null;
        });

        this.container.querySelector('.restart-button').addEventListener('click', () => {
            this.init();
        });
    }

    showMessage(message) {
        this.messageContainer.querySelector('p').textContent = message;
        this.messageContainer.style.display = 'flex'; // Use flex to center content
    }

    hideMessage() {
        this.messageContainer.style.display = 'none';
    }
}
