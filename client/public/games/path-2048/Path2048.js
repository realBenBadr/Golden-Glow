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
        
        // Check if the container already has the game structure
        if (!this.container.querySelector('.grid-container')) {
            // Initialize the game container with HTML structure
            this.container.innerHTML = `
                <div class="game-2048">
                    <!-- Back Layer Header -->
                    <div class="game-header persian-style">
                        <button class="back-button persian-button">
                            <span class="button-icon back-icon"></span>
                            RETURN TO SANCTUARY
                        </button>
                        <div class="scores-container">
                            <div class="score">WISDOM: <span id="path-score">0</span></div>
                            <div class="best-score">LEGACY: <span id="path-best-score">0</span></div>
                        </div>
                    </div>

                    <!-- Main Game Content -->
                    <div class="game-content">
                        <div class="game-header">
                            <div class="game-title">PATH OF ENLIGHTENMENT</div>
                            <div class="restart-button">NEW JOURNEY</div>
                        </div>
                        
                        <div class="grid-container"></div>
                        
                        <div class="game-message">
                            <p></p>
                            <div class="retry-button">CONTINUE YOUR QUEST</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Initialize elements
        this.messageContainer = this.container.querySelector('.game-message');
        this.gridContainer = this.container.querySelector('.grid-container');
        
        // Path score elements in the persian-style header
        this.pathScoreDisplay = document.getElementById('path-score');
        this.pathBestScoreDisplay = document.getElementById('path-best-score');
        
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

        // Add mystical particle effects
        this.addMysticalEffects();
        
        // Make sure game elements are visible
        this.ensureGameElementsVisible();
    }

    setupResponsiveLayout() {
        const isLandscape = window.innerWidth > window.innerHeight;
        const isMobile = window.innerWidth <= 480;
        
        // Calculate the optimal grid size based on viewport
        let gridSize;
        if (isLandscape) {
            gridSize = Math.min(window.innerHeight * 0.7, 450);
        } else {
            if (isMobile) {
                gridSize = Math.min(window.innerWidth * 0.9, 350);
            } else {
                gridSize = Math.min(window.innerWidth * 0.8, window.innerHeight * 0.5, 400);
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
        
        // Update container sizes - ensure proper centering
        this.container.style.width = '100%';
        this.gridContainer.style.width = `${gridSize}px`;
        this.gridContainer.style.height = `${gridSize}px`;
        
        // Ensure the grid is centered horizontally only
        this.gridContainer.style.margin = '0 auto';
        
        // Adjust game content to keep title at top, but not center vertically
        const gameContent = this.container.querySelector('.game-content');
        if (gameContent) {
            gameContent.style.display = 'flex';
            gameContent.style.flexDirection = 'column';
            gameContent.style.justifyContent = 'flex-start';
            gameContent.style.alignItems = 'center';
            
            // Set a fixed distance from top rather than centering
            const headerHeight = this.container.querySelector('.persian-style').offsetHeight;
            gameContent.style.paddingTop = '20px';
            
            // Adjust vertical positioning to keep the title at the top
            const gameHeader = gameContent.querySelector('.game-header');
            if (gameHeader) {
                gameHeader.style.marginBottom = '20px';
            }
        }
    }

    addMysticalEffects() {
        // Create glowing stars in the background
        const gameContainer = this.container.querySelector('.game-2048');
        for (let i = 0; i < 30; i++) {
            const star = document.createElement('div');
            star.className = 'mystical-star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 5}s`;
            star.style.width = `${Math.random() * 3 + 1}px`;
            star.style.height = star.style.width;
            gameContainer.appendChild(star);
        }

        // Add glowing effect to the grid
        const glowEffect = document.createElement('div');
        glowEffect.className = 'grid-glow-effect';
        this.gridContainer.appendChild(glowEffect);
    }

    initializeGrid() {
        this.gridContainer.innerHTML = '';
        
        // Create a wrapper to ensure proper grid layout
        const gridWrapper = document.createElement('div');
        gridWrapper.style.display = 'grid';
        gridWrapper.style.gridTemplateColumns = 'repeat(4, 1fr)';
        gridWrapper.style.gridTemplateRows = 'repeat(4, 1fr)';
        gridWrapper.style.gap = '10px';
        gridWrapper.style.width = '100%';
        gridWrapper.style.height = '100%';
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                gridWrapper.appendChild(cell);
            }
        }
        
        this.gridContainer.appendChild(gridWrapper);

        // Add glowing effect to the grid after initialization
        const glowEffect = document.createElement('div');
        glowEffect.className = 'grid-glow-effect';
        this.gridContainer.appendChild(glowEffect);
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
            
            // Mark as new for animation
            this.newTilePosition = {x: randomCell.x, y: randomCell.y};
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
                this.showMessage('ENLIGHTENMENT ACHIEVED!');
                this.addMysticalCelebration();
            } else if (this.checkLose()) {
                this.gameOver = true;
                this.showMessage('THE PATH ENDS HERE');
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

    addMysticalCelebration() {
        // Create a celebration effect when winning
        const celebrationContainer = document.createElement('div');
        celebrationContainer.className = 'mystical-celebration';
        
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'celebration-particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 2}s`;
            particle.style.background = `radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(201,164,91,0.8) 100%)`;
            celebrationContainer.appendChild(particle);
        }
        
        this.gridContainer.appendChild(celebrationContainer);
        
        // Remove the celebration after animation completes
        setTimeout(() => {
            if (celebrationContainer.parentNode) {
                celebrationContainer.parentNode.removeChild(celebrationContainer);
            }
        }, 5000);
    }

    updateView() {
        // Update the grid display
        this.gridContainer.innerHTML = '';
        
        // Create a wrapper to ensure proper grid layout
        const gridWrapper = document.createElement('div');
        gridWrapper.style.display = 'grid';
        gridWrapper.style.gridTemplateColumns = 'repeat(4, 1fr)';
        gridWrapper.style.gridTemplateRows = 'repeat(4, 1fr)';
        gridWrapper.style.gap = '10px';
        gridWrapper.style.width = '100%';
        gridWrapper.style.height = '100%';
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                
                if (this.grid[i][j] !== 0) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${this.grid[i][j]}`;
                    
                    // Add special animation classes
                    if (this.newTilePosition && this.newTilePosition.x === i && this.newTilePosition.y === j) {
                        tile.classList.add('tile-new');
                    }
                    
                    // Append the tile to the cell first
                    cell.appendChild(tile);
                    gridWrapper.appendChild(cell);
                } else {
                    gridWrapper.appendChild(cell);
                }
            }
        }
        
        this.gridContainer.appendChild(gridWrapper);

        // Reset the new tile position
        this.newTilePosition = null;

        // Add glowing effect to the grid
        const glowEffect = document.createElement('div');
        glowEffect.className = 'grid-glow-effect';
        this.gridContainer.appendChild(glowEffect);

        // Update scores with a slight animation
        if (this.pathScoreDisplay) {
            // Create a temporary element for animation
            const oldScore = parseInt(this.pathScoreDisplay.textContent);
            if (this.score > oldScore) {
                const scoreIncrease = document.createElement('div');
                scoreIncrease.className = 'score-increase';
                scoreIncrease.textContent = `+${this.score - oldScore}`;
                this.pathScoreDisplay.parentNode.appendChild(scoreIncrease);
                
                // Remove after animation
                setTimeout(() => {
                    if (scoreIncrease.parentNode) {
                        scoreIncrease.parentNode.removeChild(scoreIncrease);
                    }
                }, 1000);
            }
            
            this.pathScoreDisplay.textContent = this.score;
        }
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
            
            // Add glow to best score when it updates
            if (this.pathBestScoreDisplay) {
                this.pathBestScoreDisplay.parentNode.classList.add('new-best-score');
                setTimeout(() => {
                    this.pathBestScoreDisplay.parentNode.classList.remove('new-best-score');
                }, 1500);
            }
        }
        
        if (this.pathBestScoreDisplay) {
            this.pathBestScoreDisplay.textContent = this.bestScore;
        }
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

        // Add event listener for the restart button
        const restartButton = this.container.querySelector('.restart-button');
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                this.init();
            });
        }
        
        // Add event listener for the return to menu button
        const backButton = this.container.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                // Navigate back to the main menu
                window.location.href = '/';
            });
        }

        // Add event listener for the retry button
        const retryButton = this.container.querySelector('.retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                this.hideMessage();
                this.init();
            });
        }
    }

    showMessage(message) {
        this.messageContainer.querySelector('p').textContent = message;
        this.messageContainer.style.display = 'flex'; // Use flex to center content
        
        // Add fade-in animation
        this.messageContainer.style.opacity = '0';
        this.messageContainer.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            this.messageContainer.style.opacity = '1';
        }, 10);
    }

    hideMessage() {
        // Add fade-out animation
        this.messageContainer.style.opacity = '0';
        
        setTimeout(() => {
            this.messageContainer.style.display = 'none';
        }, 500);
    }

    ensureGameElementsVisible() {
        // Make sure game header is visible
        const gameHeader = this.container.querySelector('.game-header:not(.persian-style)');
        if (gameHeader) {
            gameHeader.style.display = 'flex';
            gameHeader.style.visibility = 'visible';
            gameHeader.style.opacity = '1';
            gameHeader.style.zIndex = '10';
        }
        
        // Make sure game title is visible
        const gameTitle = this.container.querySelector('.game-title');
        if (gameTitle) {
            gameTitle.style.display = 'block';
            gameTitle.style.visibility = 'visible';
            gameTitle.style.opacity = '1';
            gameTitle.style.zIndex = '10';
        }
        
        // Make sure restart button is visible
        const restartButton = this.container.querySelector('.restart-button');
        if (restartButton) {
            restartButton.style.display = 'block';
            restartButton.style.visibility = 'visible';
            restartButton.style.opacity = '1';
            restartButton.style.zIndex = '10';
        }
        
        // Make sure grid container is visible
        if (this.gridContainer) {
            this.gridContainer.style.display = 'block';
            this.gridContainer.style.visibility = 'visible';
            this.gridContainer.style.opacity = '1';
            this.gridContainer.style.zIndex = '5';
        }
    }
}
