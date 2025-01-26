export default class TapGame {
    constructor(containerId) {
        // Validate container existence
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with id '${containerId}' not found`);
        }
        this.container = container;

        // Game configuration
        this.CONFIG = {
            INITIAL_TIME: 30,
            BASE_POINTS: 10,
            MAX_COMBO: 3,
            COMBO_WINDOW: 800, // ms
            MAX_FLAMES: 4,
            FLAME_LIFETIME: 2000, // ms
            SPAWN_INTERVAL: 800 // ms
        };

        // Game state
        this.state = {
            score: 0,
            timeLeft: this.CONFIG.INITIAL_TIME,
            comboMultiplier: 1,
            isPlaying: false,
            targets: new Set(),
            lastClickTime: 0
        };

        // Cache DOM elements
        this.elements = {
            scoreElement: document.getElementById('tap-score'),
            timerElement: document.getElementById('tap-timer'),
            comboElement: document.getElementById('combo-multiplier')
        };

        // Wisdom phrases
        this.wisdomPhrases = [
            "Seek Inner Light",
            "Embrace Wisdom",
            "Find Your Path",
            "Divine Energy",
            "Sacred Balance"
        ];

        // Bind methods to maintain context
        this.handleFlameClick = this.handleFlameClick.bind(this);
        this.init();
    }

    init() {
        this.clearContainer();
        this.createStartScreen();
        this.setupEventListeners();
    }

    clearContainer() {
        this.container.innerHTML = '';
    }

    createStartScreen() {
        const startScreen = document.createElement('div');
        startScreen.className = 'start-screen';
        startScreen.innerHTML = `
            <h2>Flame of Wisdom</h2>
            <p>Tap the mystical flames to gain enlightenment</p>
            <button class="start-button persian-button">Begin Journey</button>
        `;
        
        const startButton = startScreen.querySelector('.start-button');
        startButton.addEventListener('click', () => this.startGame(), { once: true });
        this.container.appendChild(startScreen);
    }

    setupEventListeners() {
        this.container.addEventListener('click', (e) => {
            if (!this.state.isPlaying) return;
            
            const flame = e.target.closest('.mystical-flame');
            if (flame) {
                this.handleFlameClick(flame);
            }
        });
    }

    startGame() {
        this.clearContainer();
        this.resetGameState();
        this.startTimer();
        this.startFlameSpawner();
    }

    resetGameState() {
        this.state = {
            score: 0,
            timeLeft: this.CONFIG.INITIAL_TIME,
            comboMultiplier: 1,
            isPlaying: true,
            targets: new Set(),
            lastClickTime: 0
        };
        this.updateUI();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.state.timeLeft--;
            this.updateUI();
            
            if (this.state.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    startFlameSpawner() {
        this.spawnInterval = setInterval(() => {
            if (this.state.targets.size < this.CONFIG.MAX_FLAMES) {
                this.createFlame();
            }
        }, this.CONFIG.SPAWN_INTERVAL);
    }

    createFlame() {
        const flame = document.createElement('div');
        flame.className = 'mystical-flame';
        
        const innerFlame = document.createElement('div');
        innerFlame.className = 'inner-flame';
        
        const wisdomText = document.createElement('div');
        wisdomText.className = 'wisdom-text';
        wisdomText.textContent = this.getRandomWisdom();
        
        flame.append(innerFlame, wisdomText);
        
        const position = this.getRandomPosition();
        Object.assign(flame.style, {
            left: `${position.x}px`,
            top: `${position.y}px`
        });
        
        this.container.appendChild(flame);
        this.state.targets.add(flame);
        
        this.setFlameTimeout(flame);
    }

    setFlameTimeout(flame) {
        setTimeout(() => {
            if (flame.parentNode) {
                flame.classList.add('fade-out');
                setTimeout(() => {
                    flame.remove();
                    this.state.targets.delete(flame);
                }, 500);
            }
        }, this.CONFIG.FLAME_LIFETIME);
    }

    handleFlameClick(flame) {
        const now = Date.now();
        this.updateCombo(now);
        this.updateScore();
        this.createVisualEffects(flame);
        this.removeFlame(flame);
    }

    updateCombo(now) {
        if (now - this.state.lastClickTime < this.CONFIG.COMBO_WINDOW) {
            this.state.comboMultiplier = Math.min(
                this.state.comboMultiplier + 0.2,
                this.CONFIG.MAX_COMBO
            );
        } else {
            this.state.comboMultiplier = 1;
        }
        this.state.lastClickTime = now;
    }

    updateScore() {
        const points = Math.round(this.CONFIG.BASE_POINTS * this.state.comboMultiplier);
        this.state.score += points;
        this.updateUI();
    }

    handleFlameClick(flame) {
        const now = Date.now();
        this.updateCombo(now);
        
        // Add click animation class
        flame.classList.add('clicked');
        
        // Create visual effects before removal
        this.createExplosion(flame);
        this.createParticles(flame);
        
        // Update score with visual feedback
        const points = Math.round(this.CONFIG.BASE_POINTS * this.state.comboMultiplier);
        this.showPointsGained(flame, points);
        this.state.score += points;
        this.updateUI();
        
        // Remove flame after animation
        setTimeout(() => {
            flame.remove();
            this.state.targets.delete(flame);
        }, 300);
    }

    showPointsGained(flame, points) {
        const rect = flame.getBoundingClientRect();
        const pointsPopup = document.createElement('div');
        pointsPopup.className = 'points-popup';
        pointsPopup.textContent = `+${points}`;
        pointsPopup.style.left = `${rect.left + rect.width/2}px`;
        pointsPopup.style.top = `${rect.top}px`;
        document.body.appendChild(pointsPopup);
        
        setTimeout(() => pointsPopup.remove(), 1000);
    }
    createExplosion(flame) {
        const rect = flame.getBoundingClientRect();
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        explosion.style.left = `${rect.left + rect.width/2}px`;
        explosion.style.top = `${rect.top + rect.height/2}px`;
        
        // Create more particles for a richer explosion
        for (let i = 0; i < 24; i++) {
            const particle = document.createElement('div');
            particle.className = 'explosion-particle';
            const angle = (i / 24) * 360;
            const delay = Math.random() * 0.2;
            particle.style.setProperty('--angle', `${angle}deg`);
            particle.style.animationDelay = `${delay}s`;
            explosion.appendChild(particle);
        }

        document.body.appendChild(explosion);
        setTimeout(() => explosion.remove(), 1000);
    }    createParticles(flame) {
        const rect = flame.getBoundingClientRect();
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'flame-particle';
            
            const angle = (i / 8) * Math.PI * 2;
            const velocity = 2 + Math.random() * 2;
            
            particle.style.left = `${rect.left + rect.width/2}px`;
            particle.style.top = `${rect.top + rect.height/2}px`;
            
            document.body.appendChild(particle);
            
            particle.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { 
                    transform: `translate(${Math.cos(angle) * 50 * velocity}px, 
                               ${Math.sin(angle) * 50 * velocity}px) scale(0)`,
                    opacity: 0 
                }
            ], {
                duration: 1000,
                easing: 'ease-out'
            }).onfinish = () => particle.remove();
        }
    }

    getRandomPosition() {
        const rect = this.container.getBoundingClientRect();
        return {
            x: Math.random() * (rect.width - 60),
            y: Math.random() * (rect.height - 60)
        };
    }

    getRandomWisdom() {
        return this.wisdomPhrases[
            Math.floor(Math.random() * this.wisdomPhrases.length)
        ];
    }

    updateUI() {
        const { scoreElement, timerElement, comboElement } = this.elements;
        if (scoreElement) scoreElement.textContent = this.state.score;
        if (timerElement) timerElement.textContent = this.state.timeLeft;
        if (comboElement) {
            comboElement.textContent = `${this.state.comboMultiplier.toFixed(1)}x`;
        }
    }

    endGame() {
        this.state.isPlaying = false;
        clearInterval(this.timerInterval);
        clearInterval(this.spawnInterval);
        this.showGameOver();
    }

    showGameOver() {
        const gameOver = document.createElement('div');
        gameOver.className = 'game-over';
        gameOver.innerHTML = `
            <h2>Journey Complete</h2>
            <p>Enlightenment Achieved: ${this.state.score}</p>
            <button class="persian-button">Continue Journey</button>
        `;
        
        const restartButton = gameOver.querySelector('button');
        restartButton.addEventListener('click', () => this.startGame(), { once: true });
        this.container.appendChild(gameOver);
    }

    cleanup() {
        clearInterval(this.timerInterval);
        clearInterval(this.spawnInterval);
        this.container.removeEventListener('click', this.handleFlameClick);
    }
}