/**
 * Database Initialization and Check Script
 * 
 * This script connects to MongoDB, checks if required collections exist,
 * and creates them if necessary. It also displays information about
 * the database structure.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectToDatabase, closeDatabaseConnection } = require('../config/database');
const { User, GameScore } = require('../models');

async function checkDatabaseStatus() {
  try {
    console.log('Connecting to MongoDB...');
    const connection = await connectToDatabase();
    
    if (!connection) {
      console.error('Failed to connect to MongoDB. Check your connection settings.');
      process.exit(1);
    }
    
    console.log('\nDatabase Connection:');
    console.log('━━━━━━━━━━━━━━━━━━━━');
    console.log(`Database Name: ${mongoose.connection.db.databaseName}`);
    console.log(`Host: ${mongoose.connection.host}`);
    console.log(`Port: ${mongoose.connection.port}`);
    console.log(`State: ${getConnectionState()}`);
    
    // Get all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    console.log('\nCollections:');
    console.log('━━━━━━━━━━━━');
    if (collectionNames.length === 0) {
      console.log('No collections found.');
    } else {
      collectionNames.forEach(name => {
        console.log(`- ${name}`);
      });
    }
    
    // Check if required collections exist
    const requiredCollections = ['users', 'gamescores'];
    const missingCollections = requiredCollections.filter(col => !collectionNames.includes(col));
    
    if (missingCollections.length > 0) {
      console.log('\nMissing Collections:');
      console.log('━━━━━━━━━━━━━━━━━━━');
      missingCollections.forEach(name => {
        console.log(`- ${name}`);
      });
      
      // Ask if we should create missing collections
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('\nDo you want to create missing collections? (y/n): ', async (answer) => {
        readline.close();
        
        if (answer.toLowerCase() === 'y') {
          await createMissingCollections(missingCollections);
        } else {
          console.log('Skipping collection creation.');
        }
        
        await closeDatabaseConnection();
        process.exit(0);
      });
    } else {
      console.log('\nAll required collections exist.');
      
      // Check document counts
      const userCount = await User.countDocuments();
      const gameScoreCount = await GameScore.countDocuments();
      
      console.log('\nDocument Counts:');
      console.log('━━━━━━━━━━━━━━━━');
      console.log(`- Users: ${userCount}`);
      console.log(`- Game Scores: ${gameScoreCount}`);
      
      await closeDatabaseConnection();
      process.exit(0);
    }
  } catch (error) {
    console.error('Error checking database status:', error);
    await closeDatabaseConnection();
    process.exit(1);
  }
}

async function createMissingCollections(collections) {
  console.log('\nCreating missing collections...');
  
  for (const collection of collections) {
    try {
      await mongoose.connection.db.createCollection(collection);
      console.log(`✓ Created collection: ${collection}`);
      
      // Create indexes if needed
      if (collection === 'users') {
        await mongoose.connection.db.collection('users').createIndex({ telegramId: 1 }, { unique: true });
        console.log('  ✓ Created index on users.telegramId');
      } else if (collection === 'gamescores') {
        await mongoose.connection.db.collection('gamescores').createIndex({ gameId: 1, score: -1 });
        console.log('  ✓ Created index on gamescores.gameId and score');
        await mongoose.connection.db.collection('gamescores').createIndex({ userId: 1 });
        console.log('  ✓ Created index on gamescores.userId');
      }
    } catch (error) {
      console.error(`✗ Failed to create collection ${collection}:`, error);
    }
  }
  
  console.log('\nCollection creation complete.');
}

function getConnectionState() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
}

// Run the script
checkDatabaseStatus(); 