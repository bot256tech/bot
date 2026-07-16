# AGRICHAIN 360 — Production Deployment Guide

## 1. Server Requirements

- Ubuntu 22.04 or 24.04 LTS
- Node.js 18+ (LTS recommended)
- PostgreSQL 14+
- Nginx (for reverse proxy)
- PM2 (Process Manager)

---

## 2. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

---

## 3. Database Setup

```bash
# Create database
sudo -u postgres psql
CREATE DATABASE agrichain360;
CREATE USER agrichain WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE agrichain360 TO agrichain;
\q

# Import schema
psql -U agrichain -d agrichain360 -f /path/to/db/schema.sql
```

---

## 4. Application Setup

```bash
# Clone repository
git clone <your-repo-url> /var/www/agrichain360
cd /var/www/agrichain360

# Install dependencies
npm install --production

# Create .env file
cp .env.example .env
nano .env
```

**Required `.env` variables:**

```env
PORT=3000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agrichain360
DB_USER=agrichain
DB_PASSWORD=your_strong_password
```

---

## 5. Start Application with PM2

```bash
# Start the application
pm2 start server-with-websocket.js --name "agrichain360"

# Save PM2 configuration
pm2 save

# Enable startup on reboot
pm2 startup
```

---

## 6. Nginx Configuration

Create `/etc/nginx/sites-available/agrichain360`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /images/ {
        alias /var/www/agrichain360/public/images/;
        expires 30d;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/agrichain360 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 7. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## 8. Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## 9. Useful Commands

```bash
# View logs
pm2 logs agrichain360

# Restart application
pm2 restart agrichain360

# Monitor
pm2 monit

# Update application
git pull
npm install --production
pm2 restart agrichain360
```

---

**Your site will be live at:** `https://your-domain.com`

---

*Prepared by Batesa Ibrahim — 0746022547*