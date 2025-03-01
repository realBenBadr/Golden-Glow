/**
 * Socket.IO handler for Golden Glow Telegram Mini App
 * Manages all real-time communication between clients and server
 */

const TicTacToeGame = require('./games/tic-tac-toe');
const Affiliate = require('./models/Affiliate');

// Game state management
const waitingPlayers = new Map(); // gameType -> Set of waiting player sockets
const activeGames = new Map(); // gameId -> game instance

/**
 * Initialize Socket.IO with handlers
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
module.exports = function(io) {
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
}; 