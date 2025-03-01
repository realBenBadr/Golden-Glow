#!/bin/bash

# This script generates self-signed SSL certificates for development purposes
# Do NOT use these certificates in production!

# Ensure the script exits on error
set -e

# Create certificates directory if it doesn't exist
CERT_DIR="../certificates"
mkdir -p $CERT_DIR

echo "Generating development SSL certificates..."
echo "NOTE: These certificates are for development only! Do not use in production."

# Generate a private key
openssl genrsa -out $CERT_DIR/privkey.pem 2048

# Generate a certificate signing request (CSR)
openssl req -new -key $CERT_DIR/privkey.pem -out $CERT_DIR/csr.pem -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate a self-signed certificate
openssl x509 -req -days 365 -in $CERT_DIR/csr.pem -signkey $CERT_DIR/privkey.pem -out $CERT_DIR/cert.pem

# Create a full chain certificate (for development, it's just the certificate)
cp $CERT_DIR/cert.pem $CERT_DIR/fullchain.pem

# Clean up the CSR
rm $CERT_DIR/csr.pem

echo "SSL certificates generated successfully!"
echo "Location: $CERT_DIR"
echo ""
echo "To start the development HTTPS server, run:"
echo "node server/https-server.js"
echo ""
echo "NOTE: Your browser will show a security warning because these certificates are self-signed."
echo "You can safely proceed for development purposes." 