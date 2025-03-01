/**
 * GameScore Model
 * 
 * Tracks individual game scores for each user and game type.
 * Used for leaderboards and score history.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameScoreSchema = new Schema({
  // Reference to the user
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Game identifier
  gameId: {
    type: String,
    required: true,
    enum: ['tap-game', 'path-2048', 'tic-tac-toe'],
    index: true
  },
  
  // Score information
  score: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Additional game-specific data
  metadata: {
    // For path-2048
    highestTile: { type: Number },
    moveCount: { type: Number },
    
    // For tap-game
    combo: { type: Number },
    timeElapsed: { type: Number },
    
    // For tic-tac-toe
    opponent: { type: String },
    result: { type: String, enum: ['win', 'loss', 'draw'] },
    moveHistory: { type: Array }
  },
  
  // User info at the time of score (for leaderboard display)
  userInfo: {
    username: { type: String },
    firstName: { type: String },
    photoUrl: { type: String }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: { createdAt: 'createdAt' }
});

// Create compound index for leaderboards
GameScoreSchema.index({ gameId: 1, score: -1 });

/**
 * Static method to save a new game score
 * @param {string} userId - User's ID
 * @param {string} gameId - Game identifier
 * @param {number} score - Score achieved
 * @param {Object} metadata - Additional game-specific data
 * @param {Object} userInfo - User information for display
 * @returns {Promise<GameScore>} Saved game score
 */
GameScoreSchema.statics.saveScore = async function(userId, gameId, score, metadata = {}, userInfo = {}) {
  try {
    return await this.create({
      userId,
      gameId,
      score,
      metadata,
      userInfo
    });
  } catch (error) {
    console.error('Error saving game score:', error);
    throw error;
  }
};

/**
 * Static method to get leaderboard for a specific game
 * @param {string} gameId - Game identifier
 * @param {number} limit - Number of scores to return
 * @returns {Promise<Array>} Leaderboard entries
 */
GameScoreSchema.statics.getLeaderboard = async function(gameId, limit = 10) {
  try {
    return await this.find({ gameId })
      .sort({ score: -1 })
      .limit(limit)
      .select('userId score userInfo createdAt');
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
};

/**
 * Static method to get a user's best score for a game
 * @param {string} userId - User's ID
 * @param {string} gameId - Game identifier
 * @returns {Promise<GameScore>} User's best score
 */
GameScoreSchema.statics.getUserBestScore = async function(userId, gameId) {
  try {
    return await this.findOne({ userId, gameId })
      .sort({ score: -1 })
      .limit(1);
  } catch (error) {
    console.error('Error getting user best score:', error);
    throw error;
  }
};

/**
 * Static method to get a user's rank on the leaderboard
 * @param {string} userId - User's ID
 * @param {string} gameId - Game identifier
 * @returns {Promise<number>} User's rank (1-based)
 */
GameScoreSchema.statics.getUserRank = async function(userId, gameId) {
  try {
    // Get user's best score
    const userBestScore = await this.getUserBestScore(userId, gameId);
    
    if (!userBestScore) {
      return null; // User hasn't played this game yet
    }
    
    // Count how many scores are higher than the user's best score
    const higherScoresCount = await this.countDocuments({
      gameId,
      score: { $gt: userBestScore.score }
    });
    
    // Rank is 1-based (higherScoresCount + 1)
    return higherScoresCount + 1;
  } catch (error) {
    console.error('Error getting user rank:', error);
    throw error;
  }
};

// Create the model
const GameScore = mongoose.model('GameScore', GameScoreSchema);

module.exports = GameScore; 