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
    
    // Add special class for top 3 entries
    if (index < 3) {
        entry.classList.add(`rank-${index + 1}`);
    }
    
    entry.style.opacity = '0';
    entry.style.transform = 'translateY(20px)';
    
    // Create crown icon for top 3
    let rankHTML = `<div class="rank">#${index + 1}</div>`;
    if (index === 0) {
        rankHTML = `<div class="rank rank-1"><i class="fas fa-crown gold-crown"></i> #1</div>`;
    } else if (index === 1) {
        rankHTML = `<div class="rank rank-2"><i class="fas fa-crown silver-crown"></i> #2</div>`;
    } else if (index === 2) {
        rankHTML = `<div class="rank rank-3"><i class="fas fa-crown bronze-crown"></i> #3</div>`;
    }
    
    entry.innerHTML = `
        ${rankHTML}
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
        // Show loading state
        leaderboardList.innerHTML = '<div class="loading-message">Loading leaderboard data...</div>';
        
        // Get user data from Telegram WebApp
        const user = tg.initDataUnsafe?.user;
        const userId = user?.id;
        
        // Fetch real data from your backend
        const response = await fetch(`/api/leaderboard?filter=${filter}&userId=${userId || ''}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard data');
        }
        
        const data = await response.json();
        
        // Cache the data
        leaderboardData[filter] = data.leaderboard || [];
        
        // Sort data by score in descending order
        const sortedData = [...leaderboardData[filter]].sort((a, b) => b.score - a.score);
        
        // Update the display with animation
        updateLeaderboard(sortedData);
        updateUserRank(data.userRank || {});
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
function updateUserRank(userRankData) {
    // Animate rank update
    userRankValue.style.transition = 'all 0.3s ease';
    userRankValue.style.transform = 'scale(1.1)';
    userRankScore.style.transition = 'all 0.3s ease';
    userRankScore.style.transform = 'scale(1.1)';

    setTimeout(() => {
        userRankValue.textContent = userRankData.rank ? `#${userRankData.rank}` : 'Not Ranked';
        userRankScore.textContent = `Score: ${formatScore(userRankData.score || 0)}`;
        
        userRankValue.style.transform = 'scale(1)';
        userRankScore.style.transform = 'scale(1)';
    }, 150);
}

// Auto-refresh leaderboard every 30 seconds
setInterval(() => {
    loadLeaderboard(currentFilter);
}, 30000);

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    loadLeaderboard(currentFilter);
}); 