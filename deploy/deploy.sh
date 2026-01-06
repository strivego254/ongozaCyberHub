#!/bin/bash

# DigitalOcean Deployment Script for Ongoza CyberHub
# This script automates the deployment process

set -e  # Exit on error

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${YELLOW}Warning: Running as root. Consider creating a non-root user.${NC}"
fi

# Step 1: Install Node.js (using Node 20 LTS instead of 12)
echo -e "${GREEN}Step 1: Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js already installed: $(node --version)"
fi

node --version
npm --version

# Step 2: Clone or update repository
echo -e "${GREEN}Step 2: Setting up repository...${NC}"
REPO_URL="https://github.com/strivego254/ongozacyberhub.git"
PROJECT_DIR="$HOME/ongozacyberhub"

if [ -d "$PROJECT_DIR" ]; then
    echo "Repository exists, updating..."
    cd "$PROJECT_DIR"
    git pull origin main || git pull origin master
else
    echo "Cloning repository..."
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# Step 3: Install dependencies
echo -e "${GREEN}Step 3: Installing dependencies...${NC}"
cd "$PROJECT_DIR/frontend/nextjs_app"
npm install

# Step 4: Check for .env file
echo -e "${GREEN}Step 4: Checking environment variables...${NC}"
ENV_FILE="$PROJECT_DIR/frontend/nextjs_app/.env.production"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Warning: .env.production file not found!${NC}"
    echo "Creating template .env.production file..."
    cat > "$ENV_FILE" << EOF
# Next.js Environment Variables
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000
NEXT_PUBLIC_FASTAPI_API_URL=http://localhost:8001
NEXT_PUBLIC_FRONTEND_URL=https://ongozacyberhub.com

# Optional: AI Services
# GROK_API_KEY=your_grok_api_key_here
# LLAMA_ENDPOINT=http://localhost:11434

# Optional: Supabase
# SUPABASE_URL=your_supabase_url
# SUPABASE_SERVICE_KEY=your_supabase_service_key
EOF
    echo -e "${YELLOW}Please edit $ENV_FILE with your actual values before building!${NC}"
    read -p "Press Enter to continue after editing .env.production..."
fi

# Step 5: Build Next.js application
echo -e "${GREEN}Step 5: Building Next.js application...${NC}"
npm run build

# Step 6: Install PM2 globally
echo -e "${GREEN}Step 6: Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    echo "PM2 already installed"
fi

# Step 7: Setup PM2
echo -e "${GREEN}Step 7: Setting up PM2...${NC}"
cd "$PROJECT_DIR"
if [ -f "deploy/ecosystem.config.js" ]; then
    echo "Using ecosystem.config.js for PM2"
    pm2 delete ongoza-nextjs 2>/dev/null || true
    pm2 start deploy/ecosystem.config.js
else
    echo "Starting with basic PM2 command..."
    cd "$PROJECT_DIR/frontend/nextjs_app"
    pm2 delete nextjs-app 2>/dev/null || true
    pm2 start npm --name "nextjs-app" -- start
fi

pm2 save
STARTUP_CMD=$(pm2 startup ubuntu -u $USER --hp $HOME | grep -oP 'sudo.*$' || echo "")
if [ ! -z "$STARTUP_CMD" ]; then
    eval $STARTUP_CMD
fi

# Step 8: Setup Firewall
echo -e "${GREEN}Step 8: Setting up firewall...${NC}"
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 22/tcp
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status

# Step 9: Install and Configure NGINX
echo -e "${GREEN}Step 9: Installing and configuring NGINX...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt update
    sudo apt install -y nginx
fi

# Copy NGINX configuration
sudo cp "$PROJECT_DIR/deploy/nginx.conf" /etc/nginx/sites-available/ongoza-cyberhub
sudo ln -sf /etc/nginx/sites-available/ongoza-cyberhub /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart NGINX
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo -e "${GREEN}Your app should be accessible at: http://ongozacyberhub.com${NC}"
echo ""
echo -e "${YELLOW}To setup SSL:${NC}"
echo "cd $PROJECT_DIR && ./deploy/setup-ssl.sh ongozacyberhub.com"

