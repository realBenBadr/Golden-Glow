/**
 * HTTPS Server for Golden Glow Telegram Mini App
 * 
 * This file provides a direct HTTPS server implementation for the app.
 * It's an alternative to using a reverse proxy like Nginx.
 * 
 * Usage:
 *   1. Place your SSL certificates in the ./certificates directory
 *   2. Run: NODE_ENV=production node server/https-server.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const app = require('./app'); // We'll create this file next

// Path to SSL certificates
const CERT_DIR = process.env.CERT_DIR || path.join(__dirname, '../certificates');

try {
  // Load SSL certificates
  const privateKey = fs.readFileSync(path.join(CERT_DIR, 'privkey.pem'), 'utf8');
  const certificate = fs.readFileSync(path.join(CERT_DIR, 'fullchain.pem'), 'utf8');

  const credentials = {
    key: privateKey,
    cert: certificate
  };

  // Create HTTPS server
  const httpsServer = https.createServer(credentials, app);
  
  // Socket.IO initialization
  const io = require('socket.io')(httpsServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Import Socket.IO setup
  require('./socket-handler')(io);
  
  // Start HTTPS server
  const PORT = process.env.PORT || 3000;
  httpsServer.listen(PORT, () => {
    console.log(`HTTPS Server running on port ${PORT}`);
  });

} catch (error) {
  console.error('Error starting HTTPS server:', error);
  console.error('Make sure SSL certificates are correctly placed in the certificates directory.');
  console.error('See README.md for setup instructions.');
  process.exit(1);
} 