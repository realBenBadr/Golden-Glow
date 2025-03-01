# Telegram Bot Deployment Guide for Golden Glow Mini App

This guide will help you deploy your Golden Glow Telegram Mini App and connect it to a Telegram Bot.

## Prerequisites

- A domain name with HTTPS enabled (required for Telegram Mini Apps)
- Your server hosted on a platform like Heroku, DigitalOcean, or any other hosting service
- A Telegram Bot created through BotFather

## Step 1: Create a Telegram Bot

1. Open Telegram and search for the **BotFather** (@BotFather)
2. Start a chat with BotFather and send the command `/newbot`
3. Follow the prompts to create your bot:
   - First, provide a name for your bot (e.g., "Golden Glow Games")
   - Then, provide a username for your bot (must end in "bot", e.g., "GoldenGlowGamesBot")
4. BotFather will give you a token that looks like `123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ`
5. Save this token for later use

## Step 2: Configure Your Bot with BotFather

1. While still in BotFather, send `/mybots` to see your bots
2. Select your newly created bot
3. Select "Bot Settings" > "Menu Button" to set your bot's menu button
4. Choose "Configure menu button" and enter your app's URL (e.g., `https://your-domain.com`)
5. Set a menu button name (e.g., "Play Games")
6. Go back to "Bot Settings" > "Add Mini App" to enable your web app as a Mini App

## Step 3: Configure Your Server Environment

1. Update your `.env` file with the following information:
   ```
   PORT=3000
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_BOT_USERNAME=@YourBotUsername
   APP_URL=https://your-domain.com
   NODE_ENV=production
   ```

2. Make sure to replace `your_bot_token_here` with the actual token you received from BotFather.
3. Replace `https://your-domain.com` with your actual domain.
4. Replace `@YourBotUsername` with your bot's username.

## Step 4: Set Up HTTPS

Telegram Mini Apps require HTTPS. You have two options for setting this up:

### Option A: Use a Reverse Proxy (Recommended for Production)

1. Install Nginx on your server:
   ```bash
   # For Ubuntu/Debian
   sudo apt update
   sudo apt install nginx
   
   # For CentOS/RHEL
   sudo yum install nginx
   ```

2. Get SSL certificates using Let's Encrypt:
   ```bash
   # Run our helper script
   bash deployment/setup-ssl.sh your-domain.com your@email.com
   ```

3. The script will guide you through the setup process and generate the necessary configuration files.

4. After setting up Nginx and SSL, start your Node.js app:
   ```bash
   npm start
   ```

### Option B: Direct HTTPS in Node.js (Alternative)

1. Get SSL certificates using Let's Encrypt or another provider.

2. Place your certificates in the `certificates` directory:
   - `privkey.pem`: Your private key
   - `fullchain.pem`: Your certificate chain

3. Start the HTTPS server:
   ```bash
   npm run start:https
   ```

4. For development purposes only, you can generate self-signed certificates:
   ```bash
   npm run cert:dev
   ```

## Step 5: Deploy Your Application

1. Clone your repository on your server:
   ```bash
   git clone https://github.com/yourusername/golden-glow.git
   cd golden-glow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application based on your HTTPS setup choice (see Step 4).

4. Set up a process manager to keep your app running:
   ```bash
   # Install PM2
   npm install -g pm2
   
   # Start your app with PM2
   pm2 start npm --name "golden-glow" -- start
   
   # Make PM2 start on system boot
   pm2 startup
   pm2 save
   ```

## Step 6: Set Up Your Bot's Webhook

After your application is deployed and accessible via HTTPS, run the setup script to configure your bot:

```bash
npm run setup:bot https://your-domain.com
```

This script will:
- Verify your bot configuration
- Set up bot commands
- Configure the webhook to receive updates from Telegram

## Step 7: Test Your Bot

1. Open Telegram and search for your bot by its username
2. Start a chat with your bot by sending the `/start` command
3. You should see a welcome message with buttons to interact with your bot
4. Click the "Play Games" button to test your Mini App

## Troubleshooting

If your bot is not working as expected, check the following:

1. Verify that your server is accessible via HTTPS
   ```bash
   curl -I https://your-domain.com
   ```

2. Check that your bot token is correctly set in the `.env` file

3. Check the server logs for any errors:
   ```bash
   pm2 logs golden-glow
   ```

4. Make sure the webhook is properly set up:
   ```bash
   curl -X POST "https://api.telegram.org/bot<your-token>/getWebhookInfo"
   ```

5. Verify that your SSL certificates are valid:
   ```bash
   openssl x509 -in certificates/fullchain.pem -text -noout
   ```

## Additional Resources

- [Official Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

## Security Considerations

- Never commit your `.env` file to public repositories
- Use environment variables for all sensitive information
- Implement proper validation of WebApp authentication data
- Regularly update your SSL certificates
- Keep your server and dependencies up to date 