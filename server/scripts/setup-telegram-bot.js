/**
 * Telegram Bot Setup Script for Golden Glow
 * 
 * This script helps configure your Telegram bot by:
 * 1. Setting up commands that will appear in the bot menu
 * 2. Configuring the webhook to receive updates from Telegram
 * 3. Testing the bot configuration
 * 
 * Usage: node server/scripts/setup-telegram-bot.js [webhook_url]
 * Example: node server/scripts/setup-telegram-bot.js https://your-domain.com
 */

require('dotenv').config();
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Check for required environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;

if (!BOT_TOKEN) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN is not set in your .env file');
  process.exit(1);
}

if (!BOT_USERNAME) {
  console.warn('⚠️ Warning: TELEGRAM_BOT_USERNAME is not set in your .env file');
  console.warn('   This is not critical but is recommended for better user experience');
}

// Determine webhook URL from command line arguments or environment variable
let webhookUrl = process.argv[2] || process.env.APP_URL;

if (!webhookUrl) {
  console.error('❌ Error: Webhook URL is required');
  console.error('Usage: node server/scripts/setup-telegram-bot.js [webhook_url]');
  console.error('Example: node server/scripts/setup-telegram-bot.js https://your-domain.com');
  console.error('Alternatively, set APP_URL in your .env file');
  process.exit(1);
}

// Ensure webhook URL ends with /api/telegram/webhook
if (!webhookUrl.endsWith('/api/telegram/webhook')) {
  // Remove trailing slash if present
  if (webhookUrl.endsWith('/')) {
    webhookUrl = webhookUrl.slice(0, -1);
  }
  webhookUrl += '/api/telegram/webhook';
}

const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * Helper function to make API requests to Telegram
 */
async function telegramRequest(method, data = {}) {
  try {
    const response = await axios.post(`${telegramApiUrl}/${method}`, data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error calling ${method}:`, error.response?.data || error.message);
    return null;
  }
}

/**
 * Get information about the bot
 */
async function getBotInfo() {
  console.log('🔍 Getting bot information...');
  const result = await telegramRequest('getMe');
  
  if (!result || !result.ok) {
    console.error('❌ Failed to get bot information. Please check your bot token.');
    process.exit(1);
  }
  
  console.log('✅ Bot information retrieved successfully!');
  console.log(`   Bot ID: ${result.result.id}`);
  console.log(`   Bot Name: ${result.result.first_name}`);
  console.log(`   Bot Username: @${result.result.username}`);
  
  return result.result;
}

/**
 * Set bot commands
 */
async function setCommands() {
  console.log('🔧 Setting up bot commands...');
  
  const commands = [
    { command: 'start', description: 'Start the bot and see welcome message' },
    { command: 'games', description: 'Play games and earn rewards' },
    { command: 'balance', description: 'Check your current balance' },
    { command: 'referral', description: 'Get your referral link to invite friends' },
    { command: 'help', description: 'Get help using the bot' }
  ];
  
  const result = await telegramRequest('setMyCommands', { commands });
  
  if (!result || !result.ok) {
    console.error('❌ Failed to set bot commands.');
    return false;
  }
  
  console.log('✅ Bot commands set successfully!');
  return true;
}

/**
 * Set webhook for the bot
 */
async function setWebhook() {
  console.log(`🔄 Setting webhook to: ${webhookUrl}`);
  
  // First, delete any existing webhook
  await telegramRequest('deleteWebhook', { drop_pending_updates: true });
  
  // Set the new webhook
  const result = await telegramRequest('setWebhook', { 
    url: webhookUrl,
    allowed_updates: ["message", "callback_query", "inline_query", "chat_member", "my_chat_member"]
  });
  
  if (!result || !result.ok) {
    console.error('❌ Failed to set webhook.');
    console.error('   Make sure your server is accessible via HTTPS and the URL is correct.');
    return false;
  }
  
  console.log('✅ Webhook set successfully!');
  return true;
}

/**
 * Get current webhook info
 */
async function getWebhookInfo() {
  console.log('🔍 Getting webhook information...');
  
  const result = await telegramRequest('getWebhookInfo');
  
  if (!result || !result.ok) {
    console.error('❌ Failed to get webhook information.');
    return null;
  }
  
  console.log('✅ Webhook information retrieved:');
  console.log(`   URL: ${result.result.url}`);
  console.log(`   Pending updates: ${result.result.pending_update_count}`);
  
  if (result.result.last_error_date) {
    const errorDate = new Date(result.result.last_error_date * 1000);
    console.error(`⚠️ Last error: ${result.result.last_error_message} (${errorDate.toLocaleString()})`);
  } else {
    console.log('   No errors reported');
  }
  
  return result.result;
}

/**
 * Send test message to Telegram to verify the setup
 */
async function sendTestMessage(chatId) {
  if (!chatId) {
    console.log('ℹ️ No chat ID provided for test message.');
    return;
  }
  
  console.log(`📤 Sending test message to chat ID: ${chatId}`);
  
  const message = `Hello from Golden Glow! 🌟\n\nYour bot is now configured and ready to use. The webhook is set up at: ${webhookUrl}`;
  
  const result = await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML'
  });
  
  if (!result || !result.ok) {
    console.error('❌ Failed to send test message.');
    return false;
  }
  
  console.log('✅ Test message sent successfully!');
  return true;
}

/**
 * Update .env file with bot username if needed
 */
async function updateEnvFile(botUsername) {
  if (BOT_USERNAME || !botUsername) return;
  
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Add BOT_USERNAME if it doesn't exist
    if (!envContent.includes('TELEGRAM_BOT_USERNAME=')) {
      envContent += `\nTELEGRAM_BOT_USERNAME=@${botUsername}\n`;
      fs.writeFileSync(envPath, envContent);
      console.log(`✅ Added TELEGRAM_BOT_USERNAME=@${botUsername} to .env file`);
    }
  } catch (error) {
    console.error('⚠️ Could not update .env file:', error.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Telegram Bot setup for Golden Glow...\n');
  
  try {
    // Step 1: Get bot information
    const botInfo = await getBotInfo();
    if (!botInfo) return;
    
    // Update .env file with bot username if needed
    await updateEnvFile(botInfo.username);
    
    // Step 2: Set bot commands
    await setCommands();
    
    // Step 3: Set webhook
    const webhookSet = await setWebhook();
    if (!webhookSet) {
      console.error('❌ Failed to set up webhook. Bot setup is incomplete.');
      return;
    }
    
    // Step 4: Verify webhook setup
    await getWebhookInfo();
    
    // Step 5: Ask if user wants to send a test message
    console.log('\n🧪 Would you like to send a test message to verify the setup?');
    console.log('   If yes, please manually send the bot ID to send the message to.');
    console.log('   You can find your chat ID by messaging @userinfobot on Telegram.');
    console.log('   Example usage: node server/scripts/setup-telegram-bot.js https://your-domain.com 123456789');
    
    const chatId = process.argv[3];
    if (chatId) {
      await sendTestMessage(chatId);
    }
    
    console.log('\n🎉 Telegram Bot setup complete!');
    console.log(`   Your bot @${botInfo.username} is now configured and ready to use.`);
    console.log('   Users can start using your bot by searching for it on Telegram');
    console.log(`   or by clicking this link: https://t.me/${botInfo.username}`);
    
  } catch (error) {
    console.error('❌ An error occurred during setup:', error.message);
  }
}

// Run the main function
main(); 