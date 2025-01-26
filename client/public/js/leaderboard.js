// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Leaderboard state
let currentFilter = 'daily';
let leaderboardData = {
    daily: [],
    weekly: [],
    alltime: []
};

// DOM Elements
const leaderboardList = document.querySelector('.leaderboard-list');
const filterButtons = document.querySelectorAll('.leaderboard-filters .persian-button');
const userRankValue = document.querySelector('.rank-value');
const userRankScore = document.querySelector('.rank-score');

// Filter button click handlers
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentFilter = button.dataset.filter;
        loadLeaderboard(currentFilter);
    });
});

// Create a leaderboard entry element with animation
function createLeaderboardEntry(player, index) {
    const entry = document.createElement('div');
    entry.className = 'leaderboard-entry';
    entry.style.opacity = '0';
    entry.style.transform = 'translateY(20px)';
    entry.innerHTML = `
        <div class="rank">#${index + 1}</div>
        <div class="player-info">
            <img class="player-avatar" src="${player.photoUrl || 'assets/default-avatar.png'}" alt="Player avatar">
            <span class="player-name">${player.name}</span>
        </div>
        <div class="player-score">${formatScore(player.score)}</div>
    `;

    // Add animation with delay based on index
    setTimeout(() => {
        entry.style.transition = 'all 0.3s ease';
        entry.style.opacity = '1';
        entry.style.transform = 'translateY(0)';
    }, index * 50);

    return entry;
}

// Format score with commas
function formatScore(score) {
    return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Load leaderboard data
async function loadLeaderboard(filter = 'daily') {
    try {
        // Here you would typically fetch data from your backend
        // For now, we'll use mock data
        const mockData = generateMockData(filter);
        
        // Sort data by score in descending order
        const sortedData = mockData.sort((a, b) => b.score - a.score);
        
        // Update the display with animation
        updateLeaderboard(sortedData);
        updateUserRank(sortedData);
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        leaderboardList.innerHTML = '<div class="error-message">Failed to load leaderboard data</div>';
    }
}

// Update leaderboard display with smooth transitions
function updateLeaderboard(data) {
    // Clear the list with fade out
    const oldEntries = leaderboardList.children;
    Array.from(oldEntries).forEach((entry, index) => {
        entry.style.transition = 'all 0.2s ease';
        entry.style.opacity = '0';
        entry.style.transform = 'translateY(-20px)';
        setTimeout(() => entry.remove(), 200);
    });

    // Add new entries with fade in
    setTimeout(() => {
        data.forEach((player, index) => {
            const entry = createLeaderboardEntry(player, index);
            leaderboardList.appendChild(entry);
        });
    }, 250);
}

// Update user's rank display with animation
function updateUserRank(data) {
    const userId = tg.initDataUnsafe?.user?.id;
    if (!userId) return;

    const userRank = data.findIndex(player => player.userId === userId) + 1;
    const userScore = data.find(player => player.userId === userId)?.score || 0;

    // Animate rank update
    userRankValue.style.transition = 'all 0.3s ease';
    userRankValue.style.transform = 'scale(1.1)';
    userRankScore.style.transition = 'all 0.3s ease';
    userRankScore.style.transform = 'scale(1.1)';

    setTimeout(() => {
        userRankValue.textContent = userRank ? `#${userRank}` : 'Not Ranked';
        userRankScore.textContent = `Score: ${formatScore(userScore)}`;
        
        userRankValue.style.transform = 'scale(1)';
        userRankScore.style.transform = 'scale(1)';
    }, 150);
}

// Generate mock data for testing
function generateMockData(filter) {
    if (leaderboardData[filter].length > 0) {
        // Randomly update some scores to simulate real-time changes
        leaderboardData[filter].forEach(player => {
            if (Math.random() < 0.3) { // 30% chance to update score
                player.score += Math.floor(Math.random() * 100);
            }
        });
    } else {
        const count = 10;
        const data = [];
        const baseScore = filter === 'daily' ? 1000 : filter === 'weekly' ? 5000 : 10000;

        for (let i = 0; i < count; i++) {
            data.push({
                userId: `user${i}`,
                name: `Player ${i + 1}`,
                score: Math.floor(baseScore * (1 - (i * 0.1)) + Math.random() * 100),
                photoUrl: null
            });
        }
        leaderboardData[filter] = data;
    }

    // Always return a fresh sorted copy of the data
    return [...leaderboardData[filter]].sort((a, b) => b.score - a.score);
}

// Auto-refresh leaderboard every 30 seconds
setInterval(() => {
    loadLeaderboard(currentFilter);
}, 30000);

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    loadLeaderboard(currentFilter);
}); 