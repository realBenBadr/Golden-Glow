import TapGame from '../games/tap-to-earn/TapGame.js';
import Path2048 from '../games/path-2048/Path2048.js';
import TicTacToe from '../games/tic-tac-toe/TicTacToe.js';

document.addEventListener('DOMContentLoaded', () => {
    let currentGame = null;
    let userData = null;

    // Function to validate Telegram WebApp data with the server
    async function validateTelegramData() {
        try {
            // Use the TelegramAuth utility from telegram-auth.js
            if (!window.TelegramAuth) {
                console.error('TelegramAuth utility not available');
                showError('Authentication utility not available. Please reload the page.');
                return false;
            }
            
            // Initialize TelegramAuth before using it
            if (!window.TelegramAuth.initialize()) {
                console.error('Failed to initialize TelegramAuth');
                showError('Failed to initialize Telegram authentication. Please try again.');
                return false;
            }
            
            const result = await window.TelegramAuth.validateWithServer();
            if (!result.success) {
                console.error('Telegram validation failed:', result.message);
                showError(result.message || 'Authentication failed. Please try again.');
                return false;
            }

            // Store user data
            userData = result.user;
            console.log('Telegram user validated:', userData);
            return true;
        } catch (error) {
            console.error('Error validating Telegram data:', error);
            showError('Error during authentication. Please try again.');
            return false;
        }
    }

    // Show error message
    function showError(message) {
        // Use TelegramAuth showError if available, otherwise use our implementation
        if (window.TelegramAuth?.showError) {
            window.TelegramAuth.showError(message);
            return;
        }
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        document.body.prepend(errorElement);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }

    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
            screen.style.display = 'none';
        });
        const screenToShow = document.getElementById(screenId);
        if (screenToShow) {
            screenToShow.classList.remove('hidden');
            screenToShow.style.display = 'flex';
            console.log(`Showing screen: ${screenId}`);
        } else {
            console.error(`Screen not found: ${screenId}`);
        }
    }

    // Initialize the app with authentication
    async function initApp() {
        // Validate Telegram data first
        const isValid = await validateTelegramData();
        if (!isValid) {
            // Still show the app but with limited functionality
            console.warn('Proceeding with limited functionality due to validation failure');
        }
        
        // Continue with app initialization
        showScreen('main-menu');
    }

    // Game buttons
    const tapGameBtn = document.getElementById('tap-game-btn');
    const path2048Btn = document.getElementById('path-2048-btn');
    const ticTacToeBtn = document.getElementById('tic-tac-toe-btn');
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    const affiliateBtn = document.getElementById('affiliate-btn');
    
    tapGameBtn?.addEventListener('click', () => {
        try {
            console.log('Starting Tap Game');
            showScreen('tap-game-container');
            currentGame = new TapGame('tap-game-area');
        } catch (error) {
            console.error('Failed to start Tap Game:', error);
            showScreen('main-menu');
        }
    });

    path2048Btn?.addEventListener('click', () => {
        try {
            console.log('Starting Path 2048 game');
            showScreen('path-2048-container');
            currentGame = new Path2048('game-grid');
        } catch (error) {
            console.error('Failed to start Path 2048:', error);
            showScreen('main-menu');
        }
    });

    ticTacToeBtn?.addEventListener('click', () => {
        try {
            console.log('Starting Tic Tac Toe game');
            showScreen('tic-tac-toe-container');
            currentGame = new TicTacToe('tic-tac-toe-game');
        } catch (error) {
            console.error('Failed to start Tic Tac Toe:', error);
            showScreen('main-menu');
        }
    });

    leaderboardBtn?.addEventListener('click', () => {
        window.location.href = 'leaderboard.html';
    });

    affiliateBtn?.addEventListener('click', () => {
        window.location.href = 'affiliate.html';
    });

    // Initialize back buttons
    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', () => {
            console.log('Back to menu');
            if (currentGame?.cleanup) {
                currentGame.cleanup();
            }
            currentGame = null;
            showScreen('main-menu');
        });
    });

    // Show initial screen
    initApp();

    // Add haptic feedback
    document.querySelectorAll('.persian-button').forEach(button => {
        button.addEventListener('click', () => {
            button.classList.add('button-press');
            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
            }
            setTimeout(() => button.classList.remove('button-press'), 200);
        });
    });

    // Prevent default touch behaviors
    document.addEventListener('touchmove', (e) => {
        if (e.target.closest('.game-area')) {
            e.preventDefault();
        }
    }, { passive: false });

    // Prevent zooming on double tap
    let lastTap = 0;
    document.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 500 && tapLength > 0) {
            e.preventDefault();
        }
        lastTap = currentTime;
    });

    // Add active state for buttons on touch devices
    document.querySelectorAll('.persian-button').forEach(button => {
        button.addEventListener('touchstart', () => {
            button.classList.add('button-active');
        });
        
        button.addEventListener('touchend', () => {
            button.classList.remove('button-active');
        });
    });
});

function updateThemeColors(themeParams) {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', themeParams.bg_color);
    root.style.setProperty('--text-color', themeParams.text_color);
    root.style.setProperty('--button-color', themeParams.button_color);
    root.style.setProperty('--button-text-color', themeParams.button_text_color);
}