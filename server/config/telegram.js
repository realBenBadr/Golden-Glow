/**
 * Telegram Configuration and Utilities
 * 
 * This module provides functions for validating Telegram WebApp data
 * and extracting user information from it.
 */

const crypto = require('crypto');

// Get Telegram Bot Token from environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;

/**
 * Validates the data received from Telegram WebApp
 * 
 * @param {string} initData - The raw initData string from Telegram WebApp
 * @returns {boolean} - Whether the data is valid and authentic
 */
function validateTelegramWebAppData(initData) {
    if (!initData || !TELEGRAM_BOT_TOKEN) {
        return false;
    }

    // Parse the incoming data
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) {
        return false;
    }

    // Remove hash from the data string for validation
    urlParams.delete('hash');
    
    // Sort parameters alphabetically for validation
    const dataCheckString = Array.from(urlParams.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    
    // Create HMAC-SHA-256 for validation
    const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(TELEGRAM_BOT_TOKEN)
        .digest();
        
    const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');
    
    // Compare the calculated hash with the received hash
    return calculatedHash === hash;
}

/**
 * Extracts user data from validated WebApp data
 * 
 * @param {string} initData - The raw initData string from Telegram WebApp
 * @returns {Object|null} - User data object or null if extraction fails
 */
function extractUserData(initData) {
    try {
        const urlParams = new URLSearchParams(initData);
        const userStr = urlParams.get('user');
        
        if (!userStr) {
            return null;
        }
        
        const user = JSON.parse(userStr);
        
        return {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name || '',
            username: user.username || '',
            language_code: user.language_code || 'en',
            photo_url: user.photo_url || null,
            is_premium: !!user.is_premium
        };
    } catch (error) {
        console.error('Error extracting user data:', error);
        return null;
    }
}

/**
 * Extracts all parameters from initData
 * 
 * @param {string} initData - The raw initData string from Telegram WebApp
 * @returns {Object} - Object containing all extracted parameters
 */
function extractAllParams(initData) {
    if (!initData) return {};
    
    try {
        const params = {};
        const urlParams = new URLSearchParams(initData);
        
        // Extract all parameters
        for (const [key, value] of urlParams.entries()) {
            // Skip the hash as it's for validation
            if (key === 'hash') continue;
            
            // Parse JSON values
            if (key === 'user' && value) {
                try {
                    params.user = JSON.parse(value);
                } catch (e) {
                    params.user = value;
                }
                continue;
            }
            
            // Convert auth_date to Date object
            if (key === 'auth_date' && value) {
                params.auth_date = new Date(parseInt(value) * 1000);
                params.auth_date_raw = value;
                continue;
            }
            
            // Add other params
            params[key] = value;
        }
        
        return params;
    } catch (error) {
        console.error('Error extracting all params:', error);
        return {};
    }
}

/**
 * Checks if the authentication data is expired
 * 
 * @param {string} initData - The raw initData string from Telegram WebApp
 * @param {number} maxAgeMinutes - Maximum age in minutes (default: 60)
 * @returns {boolean} - True if expired, false otherwise
 */
function isAuthExpired(initData, maxAgeMinutes = 60) {
    try {
        const urlParams = new URLSearchParams(initData);
        const authDate = urlParams.get('auth_date');
        
        if (!authDate) return true;
        
        const authTimestamp = parseInt(authDate) * 1000; // Convert to milliseconds
        const now = Date.now();
        const maxAgeMs = maxAgeMinutes * 60 * 1000;
        
        return (now - authTimestamp) > maxAgeMs;
    } catch (error) {
        console.error('Error checking auth expiry:', error);
        return true; // Assume expired on error
    }
}

/**
 * Creates a URL with the bot username to open the Telegram Mini App
 * 
 * @param {string} startParam - Optional start parameter
 * @returns {string} - URL to open the Mini App
 */
function getTelegramAppUrl(startParam = '') {
    if (!BOT_USERNAME) {
        console.warn('TELEGRAM_BOT_USERNAME not set in environment variables');
        return '';
    }
    
    // Clean the username (remove @ if present)
    const username = BOT_USERNAME.replace(/^@/, '');
    
    if (startParam) {
        return `https://t.me/${username}/app?startapp=${encodeURIComponent(startParam)}`;
    }
    
    return `https://t.me/${username}/app`;
}

module.exports = {
    validateTelegramWebAppData,
    extractUserData,
    extractAllParams,
    isAuthExpired,
    getTelegramAppUrl,
    TELEGRAM_BOT_TOKEN,
    BOT_USERNAME
}; 