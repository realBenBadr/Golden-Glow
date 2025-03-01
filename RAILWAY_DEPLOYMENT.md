# Deploying Golden Glow to Railway

This guide explains how to deploy the Golden Glow Telegram Mini App to [Railway](https://railway.app).

## Prerequisites

1. A Railway account (sign up at [railway.app](https://railway.app))
2. A Telegram Bot (create one via [@BotFather](https://t.me/BotFather))
3. Basic knowledge of Git and command line tools

## Step 1: Prepare Your Project

Ensure your project has all the necessary files for Railway deployment:

- `package.json` with proper dependencies and scripts
- `Procfile` declaring how to run the app
- `railway.toml` with deployment configuration
- `.env.example` showing required environment variables

## Step 2: Create a New Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account if not already connected
5. Find and select your repository

## Step 3: Add MongoDB Service

1. In your project dashboard, click "New"
2. Select "Database" and then "MongoDB"
3. Wait for the MongoDB instance to be provisioned
4. After provisioning, click on the MongoDB service and find the connection string in the "Connect" tab

## Step 4: Configure Environment Variables

1. In your project settings, go to the "Variables" tab
2. Add the following variables:
   - `NODE_ENV`: `production`
   - `TELEGRAM_BOT_TOKEN`: Your Telegram bot token from BotFather
   - `TELEGRAM_BOT_USERNAME`: Your bot's username (without @)
   - `MONGODB_URI`: The connection string from your MongoDB service (Railway will auto-link this if you use their MongoDB)
   - `APP_URL`: Your Railway app URL (typically `https://your-project-name.railway.app`)
   - `BOT_WEBHOOK_URL`: `https://your-project-name.railway.app/api/telegram/webhook`

## Step 5: Deploy Your App

Railway will automatically deploy your app when you push changes to your connected GitHub repository. To manually deploy:

1. In your project dashboard, go to the "Deployments" tab
2. Click "Deploy now"
3. Wait for the deployment to complete

## Step 6: Set Up Telegram Bot Webhook

After deployment is complete:

1. Get your app's URL from the "Settings" tab in Railway
2. Run the following command (replace with your actual values):

```bash
curl -F "url=https://your-project-name.railway.app/api/telegram/webhook" https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
```

Alternatively, open the following URL in your browser:
`https://your-project-name.railway.app/api/telegram/webhook/setup`

## Step 7: Verify Deployment

1. Check the bot's webhook status by visiting:
   `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo`

2. Test your app by opening it in Telegram:
   - Send a message to your bot on Telegram
   - Click the Menu button in the chat with your bot
   - Your Mini App should open

## Troubleshooting

### Connection Issues
- Verify your MongoDB connection string
- Check Railway logs for any connection errors

### Webhook Issues
- Ensure your webhook URL is correct and accessible
- Check Telegram's webhook response for error messages

### App Not Loading
- Make sure all environment variables are set correctly
- Check for CORS issues in the browser console

## Railway Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway CLI](https://docs.railway.app/develop/cli)
- [Railway Pricing](https://railway.app/pricing)

## MongoDB Management

Railway provides a MongoDB instance, but for more advanced management:

1. Install MongoDB Compass from [mongodb.com/products/compass](https://www.mongodb.com/products/compass)
2. Use your MongoDB connection string to connect to your database
3. Use Compass to view, edit, and manage your collections 