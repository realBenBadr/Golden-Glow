/**
 * Protected API routes for Golden Glow Telegram Mini App
 * These routes require valid Telegram authentication to access
 */

const express = require('express');
const router = express.Router();
const telegramAuth = require('../../middleware/telegramAuth');
const { User, GameScore } = require('../../models');

/**
 * GET /api/protected/user-profile
 * Returns the authenticated user's profile information
 * Requires valid Telegram authentication
 */
router.get('/user-profile', telegramAuth, async (req, res) => {
  try {
    // Get or create user from Telegram data
    const user = await User.findOrCreateFromTelegram(req.telegramUser);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }
    
    // Return the user profile
    res.json({
      success: true,
      message: 'User profile retrieved successfully',
      user: {
        telegramUser: req.telegramUser,
        profile: {
          id: user._id,
          telegramId: user.telegramId,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          photoUrl: user.photoUrl,
          isPremium: user.isPremium
        },
        gameData: {
          coins: user.coins,
          level: user.level,
          xp: user.xp,
          totalGamesPlayed: user.totalGamesPlayed,
          gameStats: user.gameStats,
          lastActive: user.lastActive
        },
        affiliate: user.affiliate
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
});

/**
 * POST /api/protected/save-progress
 * Saves the user's game progress
 * Requires valid Telegram authentication
 */
router.post('/save-progress', telegramAuth, async (req, res) => {
  try {
    const { gameId, score, metadata = {} } = req.body;
    
    // Validate required fields
    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: gameId'
      });
    }
    
    // Get or create user
    const user = await User.findOrCreateFromTelegram(req.telegramUser);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prepare user info for game score
    const userInfo = {
      username: user.username || user.firstName,
      firstName: user.firstName,
      photoUrl: user.photoUrl
    };
    
    // Save the score
    const gameScore = await GameScore.saveScore(
      user.telegramId,
      gameId,
      score,
      metadata,
      userInfo
    );
    
    // Update user's game stats
    await user.updateGameStats(gameId, { score, ...metadata });
    
    // Return success response
    res.json({
      success: true,
      message: 'Progress saved successfully',
      userId: user.telegramId,
      gameId,
      score,
      userStats: {
        coins: user.coins,
        level: user.level,
        xp: user.xp
      }
    });
  } catch (error) {
    console.error('Error saving progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save progress',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
});

/**
 * GET /api/protected/leaderboard
 * Returns the global leaderboard with user rankings
 * Requires valid Telegram authentication
 */
router.get('/leaderboard', telegramAuth, async (req, res) => {
  try {
    const { gameId = 'tap-game', limit = 10 } = req.query;
    
    // Get or create user
    const user = await User.findOrCreateFromTelegram(req.telegramUser);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get leaderboard
    const leaderboard = await GameScore.getLeaderboard(gameId, parseInt(limit, 10));
    
    // Format leaderboard entries
    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      score: entry.score,
      username: entry.userInfo?.username || 'Unknown Player',
      firstName: entry.userInfo?.firstName,
      photoUrl: entry.userInfo?.photoUrl,
      dateAchieved: entry.createdAt
    }));
    
    // Get user's best score and rank
    const userBestScore = await GameScore.getUserBestScore(user.telegramId, gameId);
    const userRank = await GameScore.getUserRank(user.telegramId, gameId);
    
    // Prepare user's ranking info
    const userRanking = userBestScore ? {
      userId: user.telegramId,
      username: user.username || user.firstName,
      score: userBestScore.score,
      rank: userRank,
      photoUrl: user.photoUrl,
      dateAchieved: userBestScore.createdAt
    } : null;
    
    res.json({
      success: true,
      message: 'Leaderboard retrieved successfully',
      gameId,
      leaderboard: formattedLeaderboard,
      userRanking
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve leaderboard',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
});

/**
 * GET /api/protected/game-stats
 * Returns the user's statistics for a specific game
 * Requires valid Telegram authentication
 */
router.get('/game-stats', telegramAuth, async (req, res) => {
  try {
    const { gameId } = req.query;
    
    if (!gameId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameter: gameId'
      });
    }
    
    // Get or create user
    const user = await User.findOrCreateFromTelegram(req.telegramUser);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get relevant game stats based on gameId
    let gameStats = {};
    
    switch (gameId) {
      case 'tap-game':
        gameStats = user.gameStats.tapGame;
        break;
      case 'path-2048':
        gameStats = user.gameStats.path2048;
        break;
      case 'tic-tac-toe':
        gameStats = user.gameStats.ticTacToe;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: `Unknown game ID: ${gameId}`
        });
    }
    
    // Get user's best score and rank
    const userBestScore = await GameScore.getUserBestScore(user.telegramId, gameId);
    const userRank = await GameScore.getUserRank(user.telegramId, gameId);
    
    res.json({
      success: true,
      message: 'Game stats retrieved successfully',
      gameId,
      stats: gameStats,
      bestScore: userBestScore?.score || 0,
      rank: userRank || 'Unranked',
      totalGamesPlayed: user.totalGamesPlayed
    });
  } catch (error) {
    console.error('Error fetching game stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve game stats',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
});

module.exports = router; 