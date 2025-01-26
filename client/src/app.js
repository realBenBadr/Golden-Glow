import Game2048 from './games/path-2048/Game2048.js';

// Initialize Telegram WebApp
const telegram = window.Telegram.WebApp;

// Ensure the web app is ready
telegram.ready();

// Configure the main button
telegram.MainButton.setParams({
    text: 'PLAY NOW',
    color: '#ffd700',
});

// Initialize app state
const state = {
    currentScreen: 'menu',
    user: null,
    points: 0
};

// Basic navigation system
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
    state.currentScreen = screenId;
}

// User authentication
function initUser() {
    if (telegram.initDataUnsafe.user) {
        state.user = {
            id: telegram.initDataUnsafe.user.id,
            name: telegram.initDataUnsafe.user.first_name,
            username: telegram.initDataUnsafe.user.username
        };
        updateUserInterface();
    }
}

// Event Listeners
document.getElementById('play-btn').addEventListener('click', () => {
    showScreen('game-container');
    telegram.MainButton.show();
});

document.getElementById('leaderboard-btn').addEventListener('click', () => {
    // Implement leaderboard logic
});

document.getElementById('profile-btn').addEventListener('click', () => {
    // Implement profile logic
});

// In your game initialization logic
const game2048Container = document.getElementById('game-container');
const game2048 = new Game2048(game2048Container);

document.getElementById('path-2048-btn').addEventListener('click', () => {
    showScreen('game-container');
    game2048.init();
});

// Initialize the app
function init() {
    initUser();
    showScreen('main-menu');
}

// Start the app
init();