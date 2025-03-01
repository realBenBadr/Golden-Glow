/**
 * User Model
 * 
 * Represents a user in the Golden Glow application.
 * Stores user information retrieved from Telegram and application-specific data.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  // Telegram User ID (as string to handle large integer values safely)
  telegramId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // User information from Telegram
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    default: ''
  },
  username: {
    type: String,
    default: ''
  },
  languageCode: {
    type: String,
    default: 'en'
  },
  photoUrl: {
    type: String,
    default: null
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  
  // Application-specific user data
  coins: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 0
  },
  totalGamesPlayed: {
    type: Number,
    default: 0
  },
  
  // Game-specific stats
  gameStats: {
    tapGame: {
      highScore: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 },
      totalScore: { type: Number, default: 0 }
    },
    path2048: {
      highScore: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 },
      highestTile: { type: Number, default: 0 }
    },
    ticTacToe: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 }
    }
  },
  
  // Affiliate program data
  affiliate: {
    referrerId: { type: String, default: null },
    referralCode: { type: String, default: null },
    referralCount: { type: Number, default: 0 },
    bonusCoins: { type: Number, default: 0 }
  },
  
  // Timestamps
  lastActive: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { 
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
});

// Create and update user from Telegram data
UserSchema.statics.findOrCreateFromTelegram = async function(telegramUser) {
  if (!telegramUser || !telegramUser.id) {
    throw new Error('Invalid Telegram user data');
  }
  
  try {
    // Find existing user
    let user = await this.findOne({ telegramId: telegramUser.id.toString() });
    
    if (user) {
      // Update user with latest Telegram data
      user.firstName = telegramUser.first_name;
      user.lastName = telegramUser.last_name || '';
      user.username = telegramUser.username || '';
      user.languageCode = telegramUser.language_code || 'en';
      user.photoUrl = telegramUser.photo_url || null;
      user.isPremium = telegramUser.is_premium || false;
      user.lastActive = new Date();
      
      await user.save();
    } else {
      // Create new user
      user = await this.create({
        telegramId: telegramUser.id.toString(),
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name || '',
        username: telegramUser.username || '',
        languageCode: telegramUser.language_code || 'en',
        photoUrl: telegramUser.photo_url || null,
        isPremium: telegramUser.is_premium || false
      });
    }
    
    return user;
  } catch (error) {
    console.error('Error finding or creating user:', error);
    throw error;
  }
};

// Instance method to update game stats
UserSchema.methods.updateGameStats = async function(gameId, stats) {
  if (!gameId || !stats) {
    throw new Error('Game ID and stats are required');
  }
  
  // Increment total games played
  this.totalGamesPlayed += 1;
  
  // Update game-specific stats
  switch(gameId) {
    case 'tap-game':
      if (stats.score > this.gameStats.tapGame.highScore) {
        this.gameStats.tapGame.highScore = stats.score;
      }
      this.gameStats.tapGame.gamesPlayed += 1;
      this.gameStats.tapGame.totalScore += stats.score;
      break;
      
    case 'path-2048':
      if (stats.score > this.gameStats.path2048.highScore) {
        this.gameStats.path2048.highScore = stats.score;
      }
      if (stats.highestTile > this.gameStats.path2048.highestTile) {
        this.gameStats.path2048.highestTile = stats.highestTile;
      }
      this.gameStats.path2048.gamesPlayed += 1;
      break;
      
    case 'tic-tac-toe':
      if (stats.result === 'win') {
        this.gameStats.ticTacToe.wins += 1;
      } else if (stats.result === 'loss') {
        this.gameStats.ticTacToe.losses += 1;
      } else if (stats.result === 'draw') {
        this.gameStats.ticTacToe.draws += 1;
      }
      break;
      
    default:
      throw new Error(`Unknown game ID: ${gameId}`);
  }
  
  // Add XP and coins based on game performance
  const xpGained = Math.floor(stats.score / 10) || 1;
  const coinsGained = Math.floor(stats.score / 20) || 1;
  
  this.xp += xpGained;
  this.coins += coinsGained;
  
  // Update level based on XP (simple formula: 100 XP per level)
  this.level = Math.floor(this.xp / 100) + 1;
  
  // Update last active timestamp
  this.lastActive = new Date();
  
  // Save the updated user
  return this.save();
};

// Create the model
const User = mongoose.model('User', UserSchema);

module.exports = User; 