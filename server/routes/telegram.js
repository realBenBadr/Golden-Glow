const express = require('express');
const router = express.Router();
const { validateTelegramWebAppData, extractUserData, TELEGRAM_BOT_TOKEN, getTelegramAppUrl } = require('../config/telegram');
const telegramAuth = require('../middleware/telegramAuth');

// Endpoint to validate Telegram WebApp data
router.post('/validate', (req, res) => {
    try {
        const { initData } = req.body;
        
        if (!initData) {
            return res.status(400).json({ 
                success: false, 
                message: 'No initData provided' 
            });
        }
        
        const isValid = validateTelegramWebAppData(initData);
        
        if (!isValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid Telegram WebApp data' 
            });
        }
        
        const userData = extractUserData(initData);
        
        if (!userData) {
            return res.status(400).json({ 
                success: false, 
                message: 'Could not extract user data' 
            });
        }
        
        // Return validated user data
        return res.status(200).json({
            success: true,
            message: 'Telegram WebApp data validated successfully',
            user: userData
        });
    } catch (error) {
        console.error('Error validating Telegram data:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error during validation' 
        });
    }
});

// Protected endpoint example - requires Telegram authentication
router.get('/user-data', telegramAuth, (req, res) => {
    // telegramUser is added by the telegramAuth middleware
    return res.status(200).json({
        success: true,
        message: 'User data retrieved successfully',
        user: req.telegramUser,
        authDate: req.telegramAuthDate,
        startParam: req.telegramStartParam
    });
});

// Webhook endpoint to receive updates from Telegram
router.post('/webhook', (req, res) => {
    try {
        const update = req.body;
        
        // Quick response to Telegram
        res.status(200).send('OK');
        
        // Handle the update asynchronously
        handleTelegramUpdate(update).catch(error => {
            console.error('Error handling Telegram update:', error);
        });
    } catch (error) {
        console.error('Error in webhook endpoint:', error);
        res.status(500).send('Error handling webhook');
    }
});

// Function to handle Telegram updates
async function handleTelegramUpdate(update) {
    // Check if this is a message update
    if (update.message) {
        const { message } = update;
        const chatId = message.chat.id;
        
        // Handle commands
        if (message.text && message.text.startsWith('/')) {
            const command = message.text.split(' ')[0].toLowerCase();
            
            switch (command) {
                case '/start':
                    await sendStartMessage(chatId, message.from);
                    break;
                    
                case '/help':
                    await sendHelpMessage(chatId);
                    break;
                    
                case '/play':
                    await sendPlayMessage(chatId);
                    break;
                    
                case '/affiliate':
                    await sendAffiliateMessage(chatId);
                    break;
                    
                default:
                    await sendUnknownCommandMessage(chatId);
                    break;
            }
        }
    }
}

// Helper functions to send messages to users
async function sendTelegramMessage(chatId, text, options = {}) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const body = {
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            ...options
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending Telegram message:', error);
        throw error;
    }
}

async function sendStartMessage(chatId, user) {
    const firstName = user.first_name || 'there';
    const text = `
<b>Welcome to Golden Glow, ${firstName}! ✨</b>

Embark on a journey through mystical games and compete with friends for rewards.

<b>What would you like to do?</b>
    `;
    
    const options = {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{ text: "🎮 Play Games", web_app: { url: process.env.APP_URL || "https://your-app-url.com" } }],
                [{ text: "📊 View Leaderboard", callback_data: "view_leaderboard" }],
                [{ text: "👥 Affiliate Program", callback_data: "affiliate_program" }]
            ]
        })
    };
    
    return sendTelegramMessage(chatId, text, options);
}

async function sendHelpMessage(chatId) {
    const text = `
<b>Golden Glow Help Guide 📚</b>

Here are the available commands:

/start - Start the bot and access the Mini App
/play - Open the game collection
/affiliate - View your affiliate status
/help - Show this help message

Need more assistance? Contact our support at support@goldenglow.example.com
    `;
    
    return sendTelegramMessage(chatId, text);
}

async function sendPlayMessage(chatId) {
    const text = `
<b>Ready to play? 🎮</b>

Golden Glow offers mystical games filled with wonder and rewards.

<b>Click the button below to start playing:</b>
    `;
    
    const options = {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{ text: "🎮 Launch Games", web_app: { url: getTelegramAppUrl() } }]
            ]
        })
    };
    
    return sendTelegramMessage(chatId, text, options);
}

async function sendAffiliateMessage(chatId) {
    const text = `
<b>Affiliate Program 👥</b>

Share Golden Glow with friends and earn rewards!

<b>Click the button below to view your affiliate dashboard:</b>
    `;
    
    const options = {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{ text: "👥 Affiliate Dashboard", web_app: { url: `${getTelegramAppUrl('affiliate')}` } }]
            ]
        })
    };
    
    return sendTelegramMessage(chatId, text, options);
}

async function sendUnknownCommandMessage(chatId) {
    const text = `
I don't recognize that command. Try /help for a list of available commands.
    `;
    
    return sendTelegramMessage(chatId, text);
}

// Endpoint to get bot info (could be used for health checks)
router.get('/bot-info', (req, res) => {
    try {
        // Don't expose the actual token
        return res.status(200).json({
            success: true,
            message: 'Bot configuration available',
            hasToken: !!process.env.TELEGRAM_BOT_TOKEN,
            botUsername: process.env.TELEGRAM_BOT_USERNAME || null,
            appUrl: process.env.APP_URL || null
        });
    } catch (error) {
        console.error('Error getting bot info:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error fetching bot info' 
        });
    }
});

module.exports = router; 