/**
 * MongoDB Database Configuration
 * 
 * This module provides database connection functions for the application.
 * It uses Mongoose to connect to MongoDB.
 */

const mongoose = require('mongoose');

// Get MongoDB connection details from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/golden-glow';
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_AUTH_SOURCE = process.env.MONGODB_AUTH_SOURCE || 'admin';

/**
 * Connect to MongoDB
 * @returns {Promise} Mongoose connection promise
 */
async function connectToDatabase() {
  try {
    // Configure connection options
    const options = {};
    
    // Add authentication if username and password are provided
    if (MONGODB_USER && MONGODB_PASSWORD) {
      options.user = MONGODB_USER;
      options.pass = MONGODB_PASSWORD;
      options.authSource = MONGODB_AUTH_SOURCE;
    }

    // Set connection timeout
    options.connectTimeoutMS = 10000;
    
    // Set up event listeners for connection status
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established successfully');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB connection disconnected');
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await closeDatabaseConnection();
      process.exit(0);
    });

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, options);
    
    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`Connected to MongoDB database: ${dbName}`);
    
    return mongoose.connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    // Don't throw the error, just log it - let the application decide how to handle it
    return null;
  }
}

/**
 * Close the database connection
 * @returns {Promise} Promise that resolves when the connection is closed
 */
async function closeDatabaseConnection() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed gracefully');
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
}

/**
 * Check database connection status
 * @returns {Object} Connection status information
 */
function getDatabaseStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = states[mongoose.connection.readyState] || 'unknown';
  
  return {
    status: state,
    database: mongoose.connection.db?.databaseName || null,
    host: mongoose.connection.host || null,
    port: mongoose.connection.port || null,
    connected: mongoose.connection.readyState === 1
  };
}

// Export the functions
module.exports = {
  connectToDatabase,
  closeDatabaseConnection,
  getDatabaseStatus,
  getConnection: () => mongoose.connection
}; 