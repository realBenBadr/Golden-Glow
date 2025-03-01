require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const TicTacToeGame = require('./games/tic-tac-toe');
const Affiliate = require('./models/Affiliate');
const telegramRoutes = require('./routes/telegram');

// Check if Telegram Bot Token is available
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.warn('WARNING: TELEGRAM_BOT_TOKEN not set in environment variables');
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Try port 3000 first, fallback to other ports if needed
const PORT = process.env.PORT || 3000;
const FALLBACK_PORTS = [3001, 3002, 3003, 8080];

// Game state management
const waitingPlayers = new Map(); // gameType -> Set of waiting player sockets
const activeGames = new Map(); // gameId -> game instance

// Trust proxy settings for running behind a reverse proxy (like Nginx, Apache, or cloud services)
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());

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

// Routes
app.use('/api/telegram', telegramRoutes);

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Affiliate system events
  socket.on('getAffiliateData', async ({ telegramId, username }) => {
    try {
      // Validate telegramId (basic validation)
      if (!telegramId) {
        socket.emit('error', { message: 'Invalid user data' });
        return;
      }

      const affiliateData = await Affiliate.getAffiliateData(telegramId);
      socket.emit('affiliateData', affiliateData);
    } catch (error) {
      console.error('Error handling getAffiliateData:', error);
      socket.emit('error', { message: 'Failed to fetch affiliate data' });
    }
  });

  socket.on('processReferral', async ({ referralCode, newUserId, newUsername }) => {
    try {
      // Validate inputs
      if (!referralCode || !newUserId) {
        socket.emit('error', { message: 'Invalid referral data' });
        return;
      }

      const result = await Affiliate.processReferral(referralCode, newUserId, newUsername);
      socket.emit('referralProcessed', result);
    } catch (error) {
      console.error('Error processing referral:', error);
      socket.emit('error', { message: 'Failed to process referral' });
    }
  });

  socket.on('findMatch', ({ gameType }) => {
    if (!waitingPlayers.has(gameType)) {
      waitingPlayers.set(gameType, new Set());
    }
    const waitingList = waitingPlayers.get(gameType);
    
    // If there's a waiting player, create a match
    if (waitingList.size > 0) {
      const opponent = waitingList.values().next().value;
      waitingList.delete(opponent);
      
      const gameId = `${gameType}-${Date.now()}`;
      let game;

      // Create game instance based on type
      switch (gameType) {
        case 'tic-tac-toe':
          game = new TicTacToeGame(gameId, [socket.id, opponent.id]);
          break;
        // Add other game types here
        default:
          console.error('Unknown game type:', gameType);
          return;
      }
      
      activeGames.set(gameId, game);
      
      // Notify both players about the match
      socket.emit('matchFound', { 
        gameId, 
        opponent: opponent.id, 
        isFirstPlayer: true 
      });
      opponent.emit('matchFound', { 
        gameId, 
        opponent: socket.id, 
        isFirstPlayer: false 
      });

      // Send initial game state
      io.to(socket.id).emit('gameStateUpdate', { gameId, state: game.getState() });
      io.to(opponent.id).emit('gameStateUpdate', { gameId, state: game.getState() });
    } else {
      // Add player to waiting list
      waitingList.add(socket);
      socket.emit('waitingForMatch');
    }
  });

  socket.on('gameAction', ({ gameId, action }) => {
    const game = activeGames.get(gameId);
    if (!game) return;

    // Process game action based on game type
    if (game instanceof TicTacToeGame) {
      if (game.makeMove(socket.id, action.index)) {
        // Broadcast updated game state to both players
        game.players.forEach(playerId => {
          io.to(playerId).emit('gameStateUpdate', { 
            gameId, 
            state: game.getState() 
          });
        });
      }
    }
  });

  socket.on('disconnect', () => {
    // Remove player from waiting lists
    waitingPlayers.forEach(list => list.delete(socket));
    
    // Handle disconnection in active games
    activeGames.forEach((game, gameId) => {
      if (game.players.includes(socket.id)) {
        const opponent = game.players.find(id => id !== socket.id);
        if (opponent) {
          io.to(opponent).emit('opponentDisconnected', { gameId });
        }
        activeGames.delete(gameId);
      }
    });
  });
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

// Function to try starting the server on different ports
function tryStartServer(port, fallbacks = []) {
  httpServer.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  }).on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      if (fallbacks.length > 0) {
        const nextPort = fallbacks.shift();
        console.log(`Port ${port} is in use, trying port ${nextPort}...`);
        tryStartServer(nextPort, fallbacks);
      } else {
        console.error('All ports are in use. Unable to start server.');
        process.exit(1);
      }
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  });
}

// Start server with fallback ports
tryStartServer(PORT, FALLBACK_PORTS); 