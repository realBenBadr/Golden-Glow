/**
 * Verify Telegram Integration
 * 
 * This script checks your Telegram bot configuration and validates the environment setup
 * for the Golden Glow Telegram Mini App. It runs diagnostic tests to ensure that everything
 * is properly configured.
 * 
 * Usage: node server/scripts/verify-telegram-integration.js
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration to check
const requiredEnvVars = [
  'TELEGRAM_BOT_TOKEN',
  'APP_URL',
  'NODE_ENV'
];

const recommendedEnvVars = [
  'TELEGRAM_BOT_USERNAME',
  'PORT'
];

console.log('🔍 Verifying Telegram Integration for Golden Glow\n');

// Check environment variables
let hasAllRequired = true;
let missingRecommended = [];

console.log('Checking environment variables:');
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Required: ${envVar} is missing`);
    hasAllRequired = false;
  } else {
    console.log(`✅ Required: ${envVar} is set`);
  }
}

for (const envVar of recommendedEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️ Recommended: ${envVar} is missing`);
    missingRecommended.push(envVar);
  } else {
    console.log(`✅ Recommended: ${envVar} is set`);
  }
}

if (!hasAllRequired) {
  console.error('\n❌ Some required environment variables are missing. Please check your .env file.');
  process.exit(1);
}

if (missingRecommended.length > 0) {
  console.warn(`\n⚠️ Some recommended environment variables are missing: ${missingRecommended.join(', ')}`);
}

// Check if bot token is valid
async function checkBotToken() {
  console.log('\nChecking Telegram Bot Token validity...');
  try {
    const response = await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`);
    if (response.data.ok) {
      const bot = response.data.result;
      console.log(`✅ Bot token is valid for @${bot.username} (${bot.first_name})`);
      return bot;
    } else {
      console.error('❌ Bot token is invalid:', response.data.description);
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to validate bot token:', error.message);
    return null;
  }
}

// Check webhook configuration
async function checkWebhook() {
  console.log('\nChecking webhook configuration...');
  try {
    const response = await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
    if (response.data.ok) {
      const webhook = response.data.result;
      if (webhook.url) {
        console.log(`✅ Webhook is set to: ${webhook.url}`);
        
        const expectedWebhookUrl = `${process.env.APP_URL}/api/telegram/webhook`.replace(/\/$/, '');
        const actualWebhookUrl = webhook.url.replace(/\/$/, '');
        
        if (expectedWebhookUrl !== actualWebhookUrl) {
          console.warn(`⚠️ Webhook URL doesn't match APP_URL. Expected: ${expectedWebhookUrl}`);
        }
        
        if (webhook.has_custom_certificate) {
          console.log('✅ Webhook is using a custom certificate');
        }
        
        if (webhook.pending_update_count > 0) {
          console.warn(`⚠️ There are ${webhook.pending_update_count} pending updates`);
        }
        
        if (webhook.last_error_date) {
          const errorDate = new Date(webhook.last_error_date * 1000);
          console.error(`❌ Last webhook error (${errorDate.toLocaleString()}): ${webhook.last_error_message}`);
        }
      } else {
        console.warn('⚠️ No webhook URL is set. Using getUpdates polling instead?');
      }
      return webhook;
    } else {
      console.error('❌ Failed to get webhook info:', response.data.description);
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to check webhook:', error.message);
    return null;
  }
}

// Check API endpoint by making a request to the server
async function checkApiEndpoint() {
  if (!process.env.APP_URL) return false;
  
  console.log('\nChecking API endpoint accessibility...');
  try {
    const healthEndpoint = `${process.env.APP_URL}/api/health`.replace(/([^:]\/)\/+/g, "$1");
    console.log(`Trying to reach health endpoint at: ${healthEndpoint}`);
    
    const response = await axios.get(healthEndpoint, { 
      timeout: 5000,
      validateStatus: false
    });
    
    if (response.status === 200) {
      console.log('✅ API endpoint is accessible');
      return true;
    } else {
      console.warn(`⚠️ API endpoint returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to access API endpoint:', error.message);
    return false;
  }
}

// Check for required route handlers in the server code
function checkRouteHandlers() {
  console.log('\nChecking for Telegram route handlers in server code...');
  
  const filesToCheck = [
    'server/routes/telegram.js',
    'server/routes/api/telegram.js',
    'server/app.js',
    'server/index.js',
    'server/http-server.js'
  ];
  
  let foundHandler = false;
  
  for (const file of filesToCheck) {
    try {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('/api/telegram/webhook') || 
            content.includes('/telegram/webhook')) {
          console.log(`✅ Found Telegram webhook handler in ${file}`);
          foundHandler = true;
        }
      }
    } catch (error) {
      // Ignore file read errors
    }
  }
  
  if (!foundHandler) {
    console.warn('⚠️ Could not find Telegram webhook handler in common server files');
  }
  
  return foundHandler;
}

// Check for data validation function
function checkDataValidation() {
  console.log('\nChecking for Telegram data validation...');
  
  const filesToCheck = [
    'server/routes/telegram.js',
    'server/routes/api/telegram.js',
    'server/utils/telegramAuth.js',
    'server/middleware/telegramAuth.js',
    'server/app.js'
  ];
  
  let foundValidation = false;
  
  for (const file of filesToCheck) {
    try {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('initData') && 
            (content.includes('createHash') || content.includes('crypto') || content.includes('validate')) &&
            content.includes('TELEGRAM_BOT_TOKEN')) {
          console.log(`✅ Found Telegram data validation in ${file}`);
          foundValidation = true;
        }
      }
    } catch (error) {
      // Ignore file read errors
    }
  }
  
  if (!foundValidation) {
    console.warn('⚠️ Could not find Telegram data validation logic in common server files');
    console.warn('   Make sure you implement proper validation with the HMAC-SHA-256 algorithm');
  }
  
  return foundValidation;
}

// Check HTTPS configuration
function checkHttpsConfig() {
  console.log('\nChecking HTTPS configuration...');
  
  const certificatesDir = path.join(process.cwd(), 'certificates');
  
  if (!fs.existsSync(certificatesDir)) {
    console.warn('⚠️ Certificates directory not found');
    return false;
  }
  
  const privkeyPath = path.join(certificatesDir, 'privkey.pem');
  const fullchainPath = path.join(certificatesDir, 'fullchain.pem');
  
  if (!fs.existsSync(privkeyPath)) {
    console.warn('⚠️ Private key file not found at:', privkeyPath);
  } else {
    console.log('✅ Private key file exists');
  }
  
  if (!fs.existsSync(fullchainPath)) {
    console.warn('⚠️ Certificate chain file not found at:', fullchainPath);
  } else {
    console.log('✅ Certificate chain file exists');
  }
  
  // Check if direct HTTPS support exists
  try {
    const httpsServerPath = path.join(process.cwd(), 'server', 'https-server.js');
    if (fs.existsSync(httpsServerPath)) {
      console.log('✅ HTTPS server implementation found');
      return true;
    } else {
      console.warn('⚠️ No direct HTTPS server implementation found');
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking HTTPS server implementation:', error.message);
    return false;
  }
}

// Run all checks
async function runChecks() {
  const botInfo = await checkBotToken();
  if (!botInfo) {
    console.error('\n❌ Bot token validation failed. Cannot continue checks.');
    process.exit(1);
  }
  
  await checkWebhook();
  await checkApiEndpoint();
  checkRouteHandlers();
  checkDataValidation();
  checkHttpsConfig();
  
  console.log('\n=== Summary of Telegram Integration Verification ===');
  console.log(`Bot Username: @${botInfo.username}`);
  console.log(`App URL: ${process.env.APP_URL}`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log('Environment: Production');
    console.log('\n⚠️ Remember for production:');
    console.log('1. Ensure your server has a valid SSL certificate');
    console.log('2. Make sure your domain is properly configured');
    console.log('3. Set up proper webhook handling for Telegram updates');
  } else {
    console.log('Environment: Development');
    console.log('\n⚠️ For development:');
    console.log('1. You can use tools like ngrok for testing webhooks locally');
    console.log('2. Consider setting up self-signed certificates for local HTTPS');
  }
  
  console.log('\nFor more information, refer to the Telegram Mini App documentation:');
  console.log('https://core.telegram.org/bots/webapps');
}

runChecks().then(() => {
  console.log('\n✅ Verification process completed');
}).catch(error => {
  console.error('\n❌ Verification process failed:', error.message);
}); 