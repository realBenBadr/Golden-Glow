/**
 * Database Seed Script for Golden Glow
 * 
 * This script populates the MongoDB database with sample data
 * for testing and development purposes.
 */

require('dotenv').config();
const { connectToDatabase, closeDatabaseConnection } = require('../config/database');
const { User, GameScore } = require('../models');

// Sample users to be created
const sampleUsers = [
  {
    telegramId: "12345",
    firstName: "John",
    lastName: "Demo",
    username: "johndemo",
    languageCode: "en",
    isPremium: true,
    coins: 500,
    level: 5,
    xp: 450,
    totalGamesPlayed: 25,
    gameStats: {
      tapGame: {
        highScore: 1200,
        gamesPlayed: 10,
        totalScore: 9500
      },
      path2048: {
        highScore: 2048,
        gamesPlayed: 8,
        highestTile: 512
      },
      ticTacToe: {
        wins: 4,
        losses: 2,
        draws: 1
      }
    },
    affiliate: {
      referralCode: "12345-abc123",
      referralCount: 3,
      bonusCoins: 150
    }
  },
  {
    telegramId: "67890",
    firstName: "Jane",
    lastName: "Test",
    username: "janetest",
    languageCode: "en",
    isPremium: false,
    coins: 250,
    level: 3,
    xp: 230,
    totalGamesPlayed: 15,
    gameStats: {
      tapGame: {
        highScore: 800,
        gamesPlayed: 5,
        totalScore: 3500
      },
      path2048: {
        highScore: 1024,
        gamesPlayed: 6,
        highestTile: 256
      },
      ticTacToe: {
        wins: 2,
        losses: 1,
        draws: 1
      }
    },
    affiliate: {
      referrerId: "12345",
      referralCode: "67890-def456",
      referralCount: 0,
      bonusCoins: 0
    }
  }
];

// Sample game scores
const sampleGameScores = [
  {
    userId: "12345",
    gameId: "tap-game",
    score: 1200,
    metadata: {
      combo: 15,
      timeElapsed: 60
    },
    userInfo: {
      username: "johndemo",
      firstName: "John",
      photoUrl: null
    }
  },
  {
    userId: "12345",
    gameId: "path-2048",
    score: 2048,
    metadata: {
      highestTile: 512,
      moveCount: 145
    },
    userInfo: {
      username: "johndemo",
      firstName: "John",
      photoUrl: null
    }
  },
  {
    userId: "67890",
    gameId: "tap-game",
    score: 800,
    metadata: {
      combo: 10,
      timeElapsed: 45
    },
    userInfo: {
      username: "janetest",
      firstName: "Jane",
      photoUrl: null
    }
  }
];

/**
 * Seed the database with sample data
 */
async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    const connection = await connectToDatabase();
    
    if (!connection) {
      console.error('Failed to connect to MongoDB. Check your connection settings.');
      process.exit(1);
    }
    
    // Ask for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('This will add sample data to your database. Proceed? (y/n): ', async (answer) => {
      readline.close();
      
      if (answer.toLowerCase() !== 'y') {
        console.log('Operation cancelled.');
        await closeDatabaseConnection();
        process.exit(0);
      }
      
      // Clear existing data
      console.log('\nClearing existing sample data...');
      await User.deleteMany({ telegramId: { $in: sampleUsers.map(u => u.telegramId) } });
      await GameScore.deleteMany({ userId: { $in: sampleUsers.map(u => u.telegramId) } });
      
      // Add sample users
      console.log('Adding sample users...');
      for (const userData of sampleUsers) {
        const user = new User(userData);
        await user.save();
        console.log(`✓ Created user: ${userData.firstName} (${userData.telegramId})`);
      }
      
      // Add sample game scores
      console.log('\nAdding sample game scores...');
      for (const scoreData of sampleGameScores) {
        const score = new GameScore(scoreData);
        await score.save();
        console.log(`✓ Added score for ${scoreData.gameId}: ${scoreData.score} points`);
      }
      
      console.log('\nSeeding complete!');
      console.log('\nSample Accounts:');
      console.log('━━━━━━━━━━━━━━━━');
      console.log('1. John Demo (Premium)');
      console.log('   Telegram ID: 12345');
      console.log('   Referral Code: 12345-abc123');
      console.log('\n2. Jane Test');
      console.log('   Telegram ID: 67890');
      console.log('   Referral Code: 67890-def456');
      
      await closeDatabaseConnection();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    await closeDatabaseConnection();
    process.exit(1);
  }
}

// Run the seed script
seedDatabase(); 