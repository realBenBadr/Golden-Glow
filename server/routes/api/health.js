/**
 * Health API Endpoint
 * 
 * This module provides endpoints for monitoring the health and status
 * of the Golden Glow Telegram Mini App server.
 */

const express = require('express');
const router = express.Router();
const os = require('os');
const { getDatabaseStatus } = require('../../config/database');

// Basic health check endpoint
router.get('/', (req, res) => {
  const dbStatus = getDatabaseStatus();
  const isHealthy = dbStatus.connected;
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: isHealthy ? 'connected' : 'disconnected',
    message: isHealthy ? 'Golden Glow server is running' : 'Server running with database issues'
  });
});

// Detailed health information
router.get('/details', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const dbStatus = getDatabaseStatus();
  
  res.status(dbStatus.connected ? 200 : 503).json({
    status: dbStatus.connected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch
    },
    database: {
      status: dbStatus.status,
      database: dbStatus.database,
      host: dbStatus.host,
      port: dbStatus.port
    },
    uptime: {
      server: process.uptime(),
      system: os.uptime()
    },
    memory: {
      rss: formatBytes(memoryUsage.rss),
      heapTotal: formatBytes(memoryUsage.heapTotal),
      heapUsed: formatBytes(memoryUsage.heapUsed),
      external: formatBytes(memoryUsage.external)
    },
    cpu: {
      count: os.cpus().length,
      load: os.loadavg()
    },
    env: process.env.NODE_ENV || 'development'
  });
});

// Database connectivity status
router.get('/database', (req, res) => {
  const dbStatus = getDatabaseStatus();
  
  res.status(dbStatus.connected ? 200 : 503).json({
    status: dbStatus.connected ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    connection: dbStatus,
    message: dbStatus.connected 
      ? `Connected to MongoDB database: ${dbStatus.database}` 
      : 'Database connection issue'
  });
});

// Telegram health check specifically for bot communication
router.get('/telegram', async (req, res) => {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Telegram Bot Token not configured'
    });
  }
  
  try {
    const webhookUrl = await getWebhookUrl();
    
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      telegram: {
        webhook: webhookUrl,
        bot: process.env.TELEGRAM_BOT_USERNAME || 'configured'
      },
      message: 'Telegram integration is configured'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: `Telegram integration error: ${error.message}`
    });
  }
});

// Helper function to format bytes to a human-readable format
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper function to get the current webhook URL from Telegram
async function getWebhookUrl() {
  try {
    const axios = require('axios');
    const response = await axios.get(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    );
    
    if (response.data && response.data.ok) {
      return response.data.result.url || 'Not set';
    }
    return 'Unable to retrieve webhook URL';
  } catch (error) {
    throw new Error(`Could not fetch webhook info: ${error.message}`);
  }
}

module.exports = router; 