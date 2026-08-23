#!/bin/bash

# ============================================
# AGRICHAIN 360 - VPS Auto-Setup Script
# ============================================
# This script automates the VPS setup process
# Run as root or with sudo: sudo bash vps-setup.sh
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 AGRICHAIN 360 - VPS Auto-Setup${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root or with sudo${NC}"
    exit 1
fi

# Get configuration from user
read -p "Enter your domain (or press Enter for IP only): " DOMAIN
read -p "Enter database password: " -s DB_PASSWORD
echo ""
read -p "Enter your email (for SSL certificates): " EMAIL

# Generate secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || openssl rand -hex 32)
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || openssl rand -hex 32)

echo ""
echo -e "${GREEN}📦 Step 1: Updating system...${NC}"
apt update
apt upgrade -y

echo ""
echo -e "${GREEN}📦 Step 2: Installing Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

echo ""
echo -e "${GREEN}📦 Step 3: Installing PostgreSQL...${NC}"
apt install -y postgresql postgresql-contrib

echo ""
echo -e "${GREEN}📦 Step 4: Installing other dependencies...${NC}"
apt install -y git nginx ufw
npm install -g pm2

echo ""
echo -e "${GREEN}🗄️  Step 5: Setting up PostgreSQL database...${NC}"
sudo -u postgres psql << EOF
CREATE DATABASE agrichain360;
CREATE USER agrichain_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE agrichain360 TO agrichain_user;
ALTER USER agrichain_user CREATEDB;
EOF

echo ""
echo -e "${GREEN}📥 Step 6: Cloning repository...${NC}"
mkdir -p /var/www
cd /var/www
git clone https://github.com/bot256tech/bot.git agrichain360
cd agrichain360
chown -R $SUDO_USER:$SUDO_USER /var/www/agrichain360

echo ""
echo -e "${GREEN}📦 Step 7: Installing application dependencies...${NC}"
sudo -u $SUDO_USER npm install

echo ""
echo -e "${GREEN}⚙️  Step 8: Creating .env file...${NC}"
sudo -u $SUDO_USER cat > .env << EOF
# Database
DATABASE_URL=postgresql://agrichain_user:$DB_PASSWORD@localhost:5432/agrichain360

# Server
PORT=3000
NODE_ENV=production

# Security
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET

# Optional: Email (for notifications)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password

# Optional: Payment Gateway
# MTN_MOMO_API_KEY=your-mtn-momo-key
# AIRTEL_MONEY_API_KEY=your-airtel-key
EOF

echo ""
echo -e "${GREEN}🌐 Step 9: Configuring Nginx...${NC}"
if [ -n "$DOMAIN" ]; then
    SERVER_NAME="$DOMAIN www.$DOMAIN"
else
    SERVER_NAME="_"
fi

cat > /etc/nginx/sites-available/agrichain360 << EOF
server {
    listen 80;
    server_name $SERVER_NAME;

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
        
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }

    location /app/ {
        alias /var/www/agrichain360/public/app/;
        autoindex off;
    }

    location /public/ {
        alias /var/www/agrichain360/public/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
EOF

ln -sf /etc/nginx/sites-available/agrichain360 /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

echo ""
echo -e "${GREEN}🔥 Step 10: Configuring firewall...${NC}"
ufw allow ssh
ufw allow http
ufw allow https
echo "y" | ufw enable

echo ""
echo -e "${GREEN}🚀 Step 11: Starting application with PM2...${NC}"
cd /var/www/agrichain360
sudo -u $SUDO_USER pm2 start server.js --name agrichain360
sudo -u $SUDO_USER pm2 save
sudo -u $SUDO_USER pm2 startup

echo ""
echo -e "${GREEN}🌱 Step 12: Seeding marketplace...${NC}"
sudo -u $SUDO_USER node scripts/seed-marketplace-now.js

echo ""
if [ -n "$DOMAIN" ]; then
    echo -e "${GREEN}🔒 Step 13: Setting up SSL certificate...${NC}"
    apt install -y certbot python3-certbot-nginx
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect
else
    echo -e "${YELLOW}⚠️  Skipping SSL setup (no domain provided)${NC}"
fi

echo ""
echo -e "${GREEN}💾 Step 14: Setting up automatic backups...${NC}"
BACKUP_SCRIPT="/home/$SUDO_USER/backup-agrichain360.sh"
cat > $BACKUP_SCRIPT << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/agrichain360"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP="$BACKUP_DIR/db_$DATE.sql"
FILES_BACKUP="$BACKUP_DIR/files_$DATE.tar.gz"

mkdir -p $BACKUP_DIR
pg_dump -U agrichain_user agrichain360 > $DB_BACKUP
tar -czf $FILES_BACKUP /var/www/agrichain360/public/uploads 2>/dev/null || true
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x $BACKUP_SCRIPT
chown $SUDO_USER:$SUDO_USER $BACKUP_SCRIPT

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * $BACKUP_SCRIPT >> /var/log/agrichain360-backup.log 2>&1") | crontab -

echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo -e "${GREEN}📊 Application Status:${NC}"
sudo -u $SUDO_USER pm2 status

echo ""
echo -e "${GREEN}🌐 Access Your Application:${NC}"
if [ -n "$DOMAIN" ]; then
    echo "  https://$DOMAIN"
    echo "  https://www.$DOMAIN"
else
    IP=$(curl -s ifconfig.me)
    echo "  http://$IP"
fi

echo ""
echo -e "${GREEN}📱 Download APK:${NC}"
if [ -n "$DOMAIN" ]; then
    echo "  https://$DOMAIN/app/agrichain360.apk"
else
    echo "  http://$IP/app/agrichain360.apk"
fi

echo ""
echo -e "${GREEN}🔧 Useful Commands:${NC}"
echo "  View logs:        pm2 logs agrichain360"
echo "  Restart app:      pm2 restart agrichain360"
echo "  Monitor:          pm2 monit"
echo "  Update app:       cd /var/www/agrichain360 && git pull && npm install && pm2 restart agrichain360"
echo "  Nginx logs:       tail -f /var/log/nginx/error.log"
echo "  Database backup:  $BACKUP_SCRIPT"

echo ""
echo -e "${GREEN}🎉 Your AGRICHAIN 360 is now live on your VPS!${NC}"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "  - Save your database password: $DB_PASSWORD"
echo "  - Save your secrets in a secure location"
echo "  - Test all features in the app"
echo "  - Set up monitoring (optional)"
echo ""
