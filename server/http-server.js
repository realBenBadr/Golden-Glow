/**
 * HTTP Server for Golden Glow Telegram Mini App
 * 
 * This file creates a standard HTTP server using the Express app.
 * For local development, this server is sufficient.
 * For production, this server should be run behind a reverse proxy like Nginx.
 */

require('dotenv').config();
const http = require('http');
const express = require('express');
const app = require('./app');
const socketHandler = require('./socket-handler');
const { connectToDatabase, getDatabaseStatus } = require('./config/database');

// Port configuration with fallbacks
const PORT = process.env.PORT || 3000;
const FALLBACK_PORTS = [3001, 3002, 3003, 8080];

// Output environment info for debugging
console.log('=== STARTUP INFO ===');
console.log(`Node Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Node Version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log('===================');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with the HTTP server
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Set up Socket.IO handlers
try {
  console.log('Setting up Socket.IO handlers...');
  socketHandler(io);
  console.log('Socket.IO handlers initialized.');
} catch (error) {
  console.warn('Failed to initialize Socket.IO handlers:', error.message);
  // Continue anyway - this shouldn't stop the server from starting
}

// Function to try starting the server on different ports
async function tryStartServer(port, attempt = 0) {
  try {
    // CRITICAL: Start the HTTP server immediately
    server.listen(port, () => {
      console.log(`SUCCESS: Server is now listening on port ${port}`);
      console.log(`Health check endpoint: http://localhost:${port}/api/health`);
      
      // After server is started, try to connect to MongoDB in the background
      console.log('Starting database connection in background...');
      connectToDatabase()
        .then(dbConnection => {
          if (dbConnection) {
            const dbStatus = getDatabaseStatus();
            console.log(`✅ MongoDB connected to ${dbStatus.database}`);
            io.db = dbConnection;
          } else {
            console.warn('⚠️ Database connection not established. Some features may be limited.');
          }
        })
        .catch(err => {
          console.warn('⚠️ Database connection error:', err.message);
          console.log('Server will continue running with limited functionality.');
        });
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE' && attempt < FALLBACK_PORTS.length) {
        console.warn(`Port ${port} is already in use. Trying port ${FALLBACK_PORTS[attempt]}...`);
        server.close();
        tryStartServer(FALLBACK_PORTS[attempt], attempt + 1);
      } else {
        console.error('Server error:', error);
      }
    });
  } catch (error) {
    // If there was an error starting the server
    console.error('Failed to start server:', error);
    
    if (attempt < FALLBACK_PORTS.length) {
      console.warn(`Trying fallback port ${FALLBACK_PORTS[attempt]}...`);
      tryStartServer(FALLBACK_PORTS[attempt], attempt + 1);
    } else {
      console.error('Could not start the server. Please check your configuration and try again.');
      process.exit(1);
    }
  }
}

// Start the server
console.log('Starting server...');
tryStartServer(PORT); 