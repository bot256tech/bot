# AGRICHAIN 360 — Deployment & Operations Guide

Production target: Ubuntu 24.04 VPS (any provider — nothing in this setup is
provider-specific). Reference server: 16.192.159.6.

## 1. Stack

| Component | Version (reference) | Role |
|---|---|---|
| Node.js | 22.x LTS | application runtime |
| PostgreSQL | 16 | source of truth (all business data) |
| PM2 | 7.x | process manager, boot persistence |
| Nginx | 1.24 | reverse proxy, TLS termination, security headers |

## 2. Provision a fresh server

```bash
sudo apt-get update
sudo apt-get install -y curl git nginx postgresql postgresql-contrib ufw openssl

# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

## 3. Database

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE agrichain LOGIN PASSWORD '<generate-with: openssl rand -hex 24>';
CREATE DATABASE agrichain OWNER agrichain;
SQL
```

PostgreSQL listens on localhost only (default) — it is never exposed
publicly. Verify: `sudo -u postgres psql -tAc "SHOW listen_addresses;"` → `localhost`.

## 4. Application

```bash
sudo mkdir -p /opt/agrichain360 && sudo chown ubuntu:ubuntu /opt/agrichain360
cd /opt/agrichain360
git clone -b main https://github.com/bot256tech/bot.git .   # or your fork
npm ci            # clean install from package-lock.json
```

Create `/opt/agrichain360/.env` (chmod 600, owner ubuntu). Variable names:

```ini
NODE_ENV=production
PORT=3000
DATABASE_URL=            # postgres://agrichain:<password>@localhost:5432/agrichain
JWT_SECRET=              # openssl rand -hex 32
SESSION_SECRET=          # openssl rand -hex 32
APP_BASE_URL=            # e.g. http://<SERVER_IP>  (or https://yourdomain later)
ALLOWED_ORIGINS=         # comma-separated browser origins allowed by CORS
HTTPS_REDIRECT=          # false until TLS is configured; true afterwards
COOKIE_SECURE=           # true once HTTPS is active (session cookies over TLS only)
SHOW_DEMO_CREDENTIALS=   # set false to hide the demo-login panel
# Optional integrations (platform works fully without them):
# AFRICAS_TALKING_API_KEY, AFRICAS_TALKING_USERNAME, SMS_SENDER_ID
# MQTT_BROKER_URL
```

Migrate and (optionally) seed:

```bash
npm run migrate   # runs database/migrations/*.sql (also auto-runs at boot)
npm run seed      # clearly-labelled demo data (idempotent)
```

## 5. PM2

```bash
cd /opt/agrichain360
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu   # run the printed sudo command
pm2 status
```

`ecosystem.config.js` runs a single fork instance on port 3000 with logs in
`./logs/`. PM2 resurrects the app after crashes; the systemd unit resurrects
PM2 after reboots.

## 6. Nginx

`/etc/nginx/sites-available/agrichain360`:

```nginx
limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;

server {
    listen 80;
    server_name _;                     # set to your domain when ready

    location / {
        limit_req zone=general burst=20 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    client_max_body_size 10m;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
}

server {
    listen 443 ssl;
    server_name _;                     # set to your domain when ready
    # TLS: install a certificate first (section 8) — placeholder self-signed
    # cert generated at setup so https://IP responds during staging.
    ssl_certificate     /etc/nginx/ssl/agrichain.crt;
    ssl_certificate_key /etc/nginx/ssl/agrichain.key;
    # ... same location/headers block as above
}
```

```bash
sudo ln -s /etc/nginx/sites-available/agrichain360 /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 7. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

Only 22/80/443 are public. PostgreSQL (5432) and Node (3000) are localhost-only.

## 8. Domain + HTTPS (when DNS is ready)

1. Point an `A` record at the server IP.
2. Put the domain in `server_name`, set `APP_BASE_URL=https://<domain>`,
   `ALLOWED_ORIGINS=https://<domain>`, `HTTPS_REDIRECT=true` in `.env`.
3. Install a certificate:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d <domain> -d www.<domain>
```

4. `pm2 restart agrichain360`.

Until this step, the app is served on `http://<IP>` (with a self-signed TLS
endpoint on 443 for staging checks).

## 9. Health & verification

```bash
curl -s http://localhost/health | jq       # from the server
curl -s http://<IP>/health                 # from anywhere
pm2 status
sudo systemctl status nginx postgresql
```

`/health` reports app status and live database connectivity.

## 10. Backup & restore

Backup (run on the server, e.g. from cron):

```bash
sudo -u postgres pg_dump agrichain | gzip > /opt/backups/agrichain_$(date +%F_%H%M).sql.gz
```

Restore into a fresh PostgreSQL:

```bash
createdb -O agrichain agrichain
gunzip -c agrichain_<stamp>.sql.gz | psql postgres://agrichain:<password>@localhost/agrichain
```

## 11. Migrating to another VPS

1. New server: sections 2–3 and 7.
2. Copy the code (`git clone` this repository at the deployed commit).
3. Recreate `.env` (values from your password manager — never from Git).
4. Restore the latest database backup (section 10).
5. `npm ci`, `pm2 start ecosystem.config.js`, Nginx config, update DNS.
6. Verify `/health`, log in, confirm data survived.

## 12. Logs

```bash
pm2 logs agrichain360 --lines 100
tail -f /opt/agrichain360/logs/err.log
sudo tail -f /var/log/nginx/error.log
```
