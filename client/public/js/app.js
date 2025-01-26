import TapGame from '../games/tap-to-earn/TapGame.js';
import Path2048 from '../games/path-2048/Path2048.js';
import TicTacToe from '../games/tic-tac-toe/TicTacToe.js';

document.addEventListener('DOMContentLoaded', () => {
    let currentGame = null;

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

    // Game buttons
    const tapGameBtn = document.getElementById('tap-game-btn');
    const path2048Btn = document.getElementById('path-2048-btn');
    const ticTacToeBtn = document.getElementById('tic-tac-toe-btn');
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    
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
    showScreen('main-menu');

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