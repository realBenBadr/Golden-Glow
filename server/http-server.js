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
socketHandler(io);

// Function to try starting the server on different ports
async function tryStartServer(port, attempt = 0) {
  try {
    // Start the HTTP server first to ensure health checks respond quickly
    server.listen(port, () => {
      console.log(`[${process.env.NODE_ENV || 'development'}] HTTP server running on port ${port}`);
      console.log(`Server available at http://localhost:${port}`);
      console.log(`Health check endpoint: http://localhost:${port}/api/health`);
    });
    
    // Connect to MongoDB after server is listening
    console.log('Connecting to MongoDB...');
    const dbConnection = await connectToDatabase().catch(err => {
      console.warn('⚠️ Failed to connect to MongoDB, server will run with limited functionality');
      console.error('Database connection error:', err.message);
      return null;
    });
    
    if (dbConnection) {
      const dbStatus = getDatabaseStatus();
      console.log(`✅ MongoDB connected to ${dbStatus.database} at ${dbStatus.host}:${dbStatus.port}`);
      
      // Make database connection available to socket.io for use in handlers
      io.db = dbConnection;
      console.log(`Database status: http://localhost:${port}/api/health/database`);
    }
    
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
tryStartServer(PORT); 