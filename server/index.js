require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const TicTacToeGame = require('./games/tic-tac-toe');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Game state management
const waitingPlayers = new Map(); // gameType -> Set of waiting player sockets
const activeGames = new Map(); // gameId -> game instance

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from client/public
app.use(express.static(path.join(__dirname, '../client/public')));

// Serve additional static directories
app.use('/styles', express.static(path.join(__dirname, '../client/src/styles')));
app.use('/games', express.static(path.join(__dirname, '../client/src/games')));
app.use('/js', express.static(path.join(__dirname, '../client/src/js')));

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

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

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 