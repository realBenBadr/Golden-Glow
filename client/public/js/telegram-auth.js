/**
 * Telegram WebApp Authentication Helper
 * 
 * This script helps with handling Telegram WebApp data and authentication
 * on the client side. It provides utilities for validating the user data
 * with the server and extracting information from the initData.
 * 
 * Usage:
 * 1. Include this script in your HTML: <script src="/js/telegram-auth.js"></script>
 * 2. Use the TelegramAuth object to interact with Telegram WebApp data
 */

const TelegramAuth = {
  /**
   * Initializes Telegram WebApp integration
   * @returns {boolean} - Whether the WebApp was initialized successfully
   */
  initialize() {
    try {
      // Check if this is running in a Telegram WebApp
      if (!window.Telegram || !window.Telegram.WebApp) {
        console.warn('Not running in Telegram WebApp context');
        
        // Set a flag to indicate we're not in a Telegram WebApp
        this.isInTelegramWebApp = false;
        return false;
      }
      
      // Store a reference to the WebApp
      this.webApp = window.Telegram.WebApp;
      
      // Set a flag to indicate we're in a Telegram WebApp
      this.isInTelegramWebApp = true;
      
      // Initialize WebApp
      this.webApp.ready();
      
      // Expand the WebApp to its full height
      this.webApp.expand();
      
      // Get the initData for validation
      this.initData = this.webApp.initData;
      
      // Parse and store user data
      if (this.webApp.initDataUnsafe && this.webApp.initDataUnsafe.user) {
        this.user = this.webApp.initDataUnsafe.user;
      }
      
      // Store start parameter if present
      this.startParam = this.webApp.initDataUnsafe?.start_param || null;
      
      console.log('Telegram WebApp initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Telegram WebApp:', error);
      this.isInTelegramWebApp = false;
      return false;
    }
  },
  
  /**
   * Checks if current session is within a Telegram WebApp
   * @returns {boolean}
   */
  isTelegramWebApp() {
    return this.isInTelegramWebApp;
  },
  
  /**
   * Gets the raw initData string from Telegram WebApp
   * @returns {string}
   */
  getInitData() {
    return this.initData || '';
  },
  
  /**
   * Gets the parsed user object from Telegram WebApp
   * @returns {Object|null}
   */
  getUser() {
    return this.user || null;
  },
  
  /**
   * Gets the start parameter if available
   * @returns {string|null}
   */
  getStartParam() {
    return this.startParam;
  },
  
  /**
   * Validates the WebApp data with the server
   * @returns {Promise<Object>} - Result of validation
   */
  async validateWithServer() {
    if (!this.initData) {
      return { success: false, message: 'No initData available' };
    }
    
    try {
      const response = await fetch('/api/telegram/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': this.initData
        },
        body: JSON.stringify({ initData: this.initData })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error validating with server:', error);
      return { 
        success: false, 
        message: 'Error validating with server',
        error: error.message
      };
    }
  },
  
  /**
   * Makes an authenticated API request
   * @param {string} url - The URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>}
   */
  async authenticatedFetch(url, options = {}) {
    if (!this.initData) {
      throw new Error('No Telegram authentication data available');
    }
    
    // Set up headers with Telegram init data
    const headers = {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': this.initData,
      ...(options.headers || {})
    };
    
    // Make the request with authentication
    return fetch(url, {
      ...options,
      headers
    });
  },
  
  /**
   * Saves game progress to the server
   * @param {string} gameId - ID of the game (e.g., 'tap-game', 'path-2048', 'tic-tac-toe')
   * @param {number} score - Score achieved in the game
   * @param {Object} metadata - Additional game-specific data
   * @returns {Promise<Object>} - Server response
   */
  async saveGameProgress(gameId, score, metadata = {}) {
    if (!this.initData) {
      throw new Error('No Telegram authentication data available');
    }
    
    try {
      const response = await this.authenticatedFetch('/api/protected/save-progress', {
        method: 'POST',
        body: JSON.stringify({
          gameId,
          score,
          metadata
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save game progress');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving game progress:', error);
      this.showError(`Unable to save your progress: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Fetches the leaderboard for a specific game
   * @param {string} gameId - ID of the game
   * @param {number} limit - Number of entries to fetch
   * @returns {Promise<Object>} - Leaderboard data
   */
  async getLeaderboard(gameId = 'tap-game', limit = 10) {
    try {
      const response = await this.authenticatedFetch(
        `/api/protected/leaderboard?gameId=${gameId}&limit=${limit}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch leaderboard');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  },
  
  /**
   * Fetches game statistics for the current user
   * @param {string} gameId - ID of the game
   * @returns {Promise<Object>} - Game statistics
   */
  async getGameStats(gameId) {
    try {
      const response = await this.authenticatedFetch(
        `/api/protected/game-stats?gameId=${gameId}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch game statistics');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching game statistics:', error);
      throw error;
    }
  },
  
  /**
   * Shows an error message to the user
   * @param {string} message - The error message to display
   */
  showError(message) {
    if (this.webApp && this.webApp.showPopup) {
      this.webApp.showPopup({
        title: 'Error',
        message,
        buttons: [{ type: 'close' }]
      });
    } else {
      alert(`Error: ${message}`);
    }
  },
  
  /**
   * Shows a confirmation message to the user
   * @param {string} message - The message to display
   * @param {Function} onConfirm - Callback for confirmation
   */
  showConfirmation(message, onConfirm) {
    if (this.webApp && this.webApp.showPopup) {
      this.webApp.showPopup({
        title: 'Confirmation',
        message,
        buttons: [
          { id: 'cancel', type: 'cancel' },
          { id: 'confirm', type: 'default', text: 'Confirm' }
        ]
      }, (buttonId) => {
        if (buttonId === 'confirm' && onConfirm) {
          onConfirm();
        }
      });
    } else {
      if (confirm(message) && onConfirm) {
        onConfirm();
      }
    }
  },
  
  /**
   * Closes the WebApp
   */
  close() {
    if (this.webApp) {
      this.webApp.close();
    }
  }
};

// Auto-initialize when the script loads
document.addEventListener('DOMContentLoaded', () => {
  TelegramAuth.initialize();
}); 