# AGRICHAIN 360 — Ubuntu Production Deployment Guide

This guide walks you through deploying AGRICHAIN 360 on a fresh Ubuntu 22.04 / 24.04 server.

---

## 1. Server Preparation

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx
```

---

## 2. Install Node.js (LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

---

## 3. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

---

## 4. Clone & Setup the App

```bash
git clone <your-repo-url> /var/www/agrichain360
cd /var/www/agrichain360

npm install --production

# Create production .env
cp .env.example .env
nano .env
```

**Recommended `.env` for production:**

```env
PORT=3000
NODE_ENV=production
```

---

## 5. Create Logs Directory

```bash
mkdir -p /var/www/agrichain360/logs
```

---

## 6. Start with PM2

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

Follow the printed command to enable auto-start on reboot.

---

## 7. Configure Nginx (Reverse Proxy)

Create `/etc/nginx/sites-available/agrichain360`:

```nginx
server {
    listen 80;
    server_name your-domain.com;   # or your server IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Optional: serve static files directly
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

## 8. Enable HTTPS (Recommended)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## 9. Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## 10. Useful PM2 Commands

```bash
pm2 status
pm2 logs agrichain360
pm2 restart agrichain360
pm2 reload agrichain360
pm2 monit
```

---

## 11. Update / Restart

```bash
cd /var/www/agrichain360
git pull
npm install --production
pm2 reload agrichain360
```

---

**Your site will now be live at:** `http://your-server-ip` or your domain.

---

*Contact: Batesa Ibrahim — 0746022547 — batesaibra6@gmail.com*