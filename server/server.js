const express = require('express');
const app = express();
const path = require('path');

// Parse JSON request body
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../client/public')));

// Sample leaderboard data (in a real app, this would come from a database)
const sampleLeaderboardData = {
    daily: Array.from({ length: 10 }, (_, i) => ({
        userId: `user${i}`,
        name: `Player ${i + 1}`,
        score: Math.floor(1000 * (1 - (i * 0.1)) + Math.random() * 100),
        photoUrl: null
    })),
    weekly: Array.from({ length: 10 }, (_, i) => ({
        userId: `user${i}`,
        name: `Player ${i + 1}`,
        score: Math.floor(5000 * (1 - (i * 0.08)) + Math.random() * 500),
        photoUrl: null
    })),
    alltime: Array.from({ length: 10 }, (_, i) => ({
        userId: `user${i}`,
        name: `Player ${i + 1}`,
        score: Math.floor(10000 * (1 - (i * 0.05)) + Math.random() * 1000),
        photoUrl: null
    }))
};

// API endpoint for leaderboard data
app.get('/api/leaderboard', (req, res) => {
    const { filter = 'daily', userId } = req.query;
    
    // Get the appropriate leaderboard data based on the filter
    const leaderboard = sampleLeaderboardData[filter] || [];
    
    // Sort by score in descending order
    const sortedLeaderboard = [...leaderboard].sort((a, b) => b.score - a.score);
    
    // Find user's rank if userId is provided
    let userRank = {};
    if (userId) {
        const userIndex = sortedLeaderboard.findIndex(player => player.userId === userId);
        if (userIndex !== -1) {
            userRank = {
                rank: userIndex + 1,
                score: sortedLeaderboard[userIndex].score
            };
        } else {
            // If user is not on the leaderboard, set default values
            userRank = {
                rank: null,
                score: 0
            };
        }
    }
    
    // Return leaderboard data and user's rank
    res.json({
        leaderboard: sortedLeaderboard,
        userRank
    });
});

// Handle all routes for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 