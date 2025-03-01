/**
 * Telegram Authentication Middleware
 * 
 * This middleware validates the Telegram WebApp authentication data
 * and adds the authenticated user to the request object.
 */

const { validateTelegramWebAppData, extractUserData } = require('../config/telegram');

/**
 * Middleware to validate Telegram WebApp authentication
 * 
 * Use this on routes that need to be protected with Telegram authentication.
 * It expects the initData to be in the request headers as 'x-telegram-init-data'
 * or in the request body as 'initData'.
 * 
 * Example usage:
 * router.get('/protected-route', telegramAuth, (req, res) => {
 *   // Access authenticated user data with req.telegramUser
 * });
 */
function telegramAuth(req, res, next) {
  try {
    // Get initData from header or body
    const initData = req.headers['x-telegram-init-data'] || req.body.initData;
    
    if (!initData) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required: Missing Telegram WebApp data'
      });
    }
    
    // Validate the initData
    const isValid = validateTelegramWebAppData(initData);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: Invalid Telegram WebApp data'
      });
    }
    
    // Extract and attach the user data to the request
    const userData = extractUserData(initData);
    
    if (!userData) {
      return res.status(400).json({
        success: false,
        message: 'Authentication error: Could not extract user data'
      });
    }
    
    // Add the validated user data to the request
    req.telegramUser = userData;
    
    // Parse additional params from initData
    try {
      const params = new URLSearchParams(initData);
      req.telegramAuthDate = params.get('auth_date');
      req.telegramQueryId = params.get('query_id');
      req.telegramStartParam = params.get('start_param');
    } catch (err) {
      console.warn('Could not parse additional params from initData', err);
    }
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Telegram authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error: Internal server error'
    });
  }
}

module.exports = telegramAuth; 