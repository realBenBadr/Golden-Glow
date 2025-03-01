#!/bin/bash

# setup-ssl.sh - Script to set up SSL certificates with Let's Encrypt and configure Nginx
# Usage: bash setup-ssl.sh yourdomain.com your@email.com

set -e

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or with sudo"
  exit 1
fi

# Check if the correct number of arguments is provided
if [ "$#" -lt 2 ]; then
  echo "Usage: $0 yourdomain.com your@email.com"
  exit 1
fi

DOMAIN=$1
EMAIL=$2
APP_DIR=$(pwd)
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

echo "Setting up SSL certificates for $DOMAIN"
echo "Using email: $EMAIL"
echo "Application directory: $APP_DIR"

# Check for Certbot installation
if ! command -v certbot &> /dev/null; then
  echo "Certbot not found. Installing Certbot..."
  
  # Detect OS and install Certbot
  if command -v apt-get &> /dev/null; then
    # Debian/Ubuntu
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
  elif command -v yum &> /dev/null; then
    # CentOS/RHEL
    yum install -y epel-release
    yum install -y certbot python3-certbot-nginx
  else
    echo "Unable to install Certbot automatically. Please install it manually."
    exit 1
  fi
fi

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
  echo "Nginx not found. Installing Nginx..."
  
  # Detect OS and install Nginx
  if command -v apt-get &> /dev/null; then
    # Debian/Ubuntu
    apt-get update
    apt-get install -y nginx
  elif command -v yum &> /dev/null; then
    # CentOS/RHEL
    yum install -y nginx
  else
    echo "Unable to install Nginx automatically. Please install it manually."
    exit 1
  fi
fi

# Create Nginx configuration
echo "Creating Nginx configuration for $DOMAIN..."

# Create the configuration file
cat > "$NGINX_AVAILABLE/$DOMAIN.conf" << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL certificates will be added by Certbot

    # Optimizations
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1h;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers "EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH";

    # HSTS (comment out if not needed)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # Other security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";

    # Reverse proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static file caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        expires 7d;
        add_header Cache-Control "public";
    }
}
EOF

# Enable the site
ln -sf "$NGINX_AVAILABLE/$DOMAIN.conf" "$NGINX_ENABLED/$DOMAIN.conf"

# Check Nginx configuration
echo "Checking Nginx configuration..."
nginx -t

# Reload Nginx to apply changes
echo "Reloading Nginx..."
systemctl reload nginx

# Get SSL certificate with Certbot
echo "Obtaining SSL certificates from Let's Encrypt..."
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "$EMAIL"

# Create a directory for certificates in the application
mkdir -p "$APP_DIR/certificates"

# Copy the certificates to the application directory
echo "Copying certificates to the application directory..."
cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$APP_DIR/certificates/"
cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$APP_DIR/certificates/"

# Set appropriate permissions
chown -R $(whoami) "$APP_DIR/certificates"
chmod 600 "$APP_DIR/certificates/privkey.pem"
chmod 644 "$APP_DIR/certificates/fullchain.pem"

# Set up certificate renewal cron job
echo "Setting up automatic certificate renewal..."
(crontab -l 2>/dev/null || echo "") | grep -v 'certbot renew' | { cat; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx; cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $APP_DIR/certificates/; cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $APP_DIR/certificates/;'"; } | crontab -

echo "============================================================"
echo "SSL setup complete for $DOMAIN!"
echo "Your site should now be accessible at: https://$DOMAIN"
echo 
echo "Certificate auto-renewal has been configured."
echo "Certificates have been copied to: $APP_DIR/certificates/"
echo
echo "You can now start your Node.js application with:"
echo "  npm start"
echo "============================================================" 