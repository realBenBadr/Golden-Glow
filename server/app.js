/**
 * Express application for Golden Glow Telegram Mini App
 * This file separates the Express app from server implementations,
 * allowing both HTTP and HTTPS servers to use the same app logic.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const telegramRoutes = require('./routes/telegram');
const healthRoutes = require('./routes/api/health');
const protectedRoutes = require('./routes/api/protected');
const telegramAuth = require('./middleware/telegramAuth');

// Create Express app
const app = express();

// CRITICAL: Direct minimal health check that doesn't rely on other components
// This ensures Railway health checks can succeed immediately
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Server is starting up'
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Make telegramAuth middleware available to all routes
app.use((req, res, next) => {
  req.telegramAuth = telegramAuth;
  next();
});

// Trust proxy settings for running behind a reverse proxy
app.set('trust proxy', 1);

// Force HTTPS redirect in production environments
app.use((req, res, next) => {
  // Skip HTTPS redirect for local development
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    return next();
  }
  
  // If the request is already secure or is from a trusted proxy that handles SSL
  if (req.secure || (req.headers['x-forwarded-proto'] === 'https')) {
    next();
  } else {
    // Redirect to HTTPS
    const httpsUrl = `https://${req.headers.host}${req.url}`;
    res.redirect(301, httpsUrl);
  }
});

// Serve static files from client/public
app.use(express.static(path.join(__dirname, '../client/public')));

// Serve additional static directories
app.use('/styles', express.static(path.join(__dirname, '../client/public/styles')));
app.use('/js', express.static(path.join(__dirname, '../client/public/js')));
app.use('/assets', express.static(path.join(__dirname, '../client/public/assets')));

// API routes
app.use('/api/telegram', telegramRoutes);
// Notice we comment out the standard health routes to avoid conflicts with our direct route
// app.use('/api/health', healthRoutes);
app.use('/api/protected', protectedRoutes);

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, '../client/public/404.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

module.exports = app; 