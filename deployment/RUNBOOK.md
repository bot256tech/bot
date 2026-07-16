# AGRICHAIN 360™ — Deployment Runbook

**Purpose:** Step-by-step guide to deploy AGRICHAIN 360™ from local development to production.

---

## Prerequisites

- GitHub account with repository access
- Render.com account (free tier)
- Africa's Talking account (for SMS/USSD)
- MTN MoMo Developer account
- Domain name (agrichain360.com)
- Local development environment working

---

## Step 1: Provision PostgreSQL Database (10 minutes)

### On Render.com:

1. Login to https://render.com
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name:** `agrichain360-prod-db`
   - **Database:** `agrichain360`
   - **User:** `agrichain_user`
   - **Region:** Frankfurt (closest to Uganda)
   - **Plan:** Starter ($7/month, 10GB storage)
4. Click **Create Database**
5. Wait 2-3 minutes for provisioning
6. Copy the **Internal Connection String**:
   ```
   postgresql://agrichain_user:password@dpg-xxxx.render.com:5432/agrichain360
   ```
7. Enable **Automatic Backups** (daily, 30-day retention)

---

## Step 2: Generate Secure Secrets (5 minutes)

Run this command locally to generate cryptographically secure secrets:

```bash
# Generate JWT secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate Session secret
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate Passport signing secret
node -e "console.log('PASSPORT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

**Save these securely** (password manager, not in code).

---

## Step 3: Configure Environment Variables (15 minutes)

### On Render.com:

1. Go to your Web Service → **Environment**
2. Add each variable from the `.env.production` template:

```bash
NODE_ENV=production
PORT=3000

# Database (from Step 1)
DATABASE_URL=postgresql://agrichain_user:password@dpg-xxxx.render.com:5432/agrichain360

# Security (from Step 2)
JWT_SECRET=[paste generated secret]
SESSION_SECRET=[paste generated secret]
PASSPORT_SECRET=[paste generated secret]

# Payment - MTN MoMo
MTN_MOMO_API_USER=[your API user UUID]
MTN_MOMO_API_KEY=[your API key]
MTN_SUBSCRIPTION_KEY=[your subscription key]
MTN_CALLBACK_URL=https://agrichain360.com/api/v1/payments/callback/mtn

# Payment - Airtel Money
AIRTEL_CLIENT_ID=[your client ID]
AIRTEL_CLIENT_SECRET=[your client secret]
AIRTEL_CALLBACK_URL=https://agrichain360.com/api/v1/payments/callback/airtel

# SMS & USSD - Africa's Talking
AFRICAS_TALKING_API_KEY=[your API key]
AFRICAS_TALKING_USERNAME=[your username]
SMS_SENDER_ID=AGRICHAIN
USSD_WEBHOOK_URL=https://agrichain360.com/api/v1/ussd

# Monitoring
SENTRY_DSN=[your Sentry DSN]
LOG_LEVEL=error

# URLs
WEB_URL=https://agrichain360.com
API_URL=https://api.agrichain360.com

# CORS
ALLOWED_ORIGINS=https://agrichain360.com,https://www.agrichain360.com,https://app.agrichain360.com

# Payment
PAYMENT_COMMISSION_RATE=0.10
```

---

## Step 4: Deploy Backend to Render (15 minutes)

### Create Web Service:

1. Click **New +** → **Web Service**
2. Connect your GitHub repository: `bot256tech/bot`
3. Configure:
   - **Name:** `agrichain360-api`
   - **Region:** Frankfurt
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node 18
   - **Plan:** Starter ($7/month)
4. Click **Create Web Service**
5. Wait for deployment (2-5 minutes)
6. Check logs for:
   ```
   ✅ PostgreSQL connected
   ✅ Web routes mounted
   ✅ API Auth mounted at /api/v1/auth
   ...
   🚀 AGRICHAIN 360 running on port 3000
   ```

---

## Step 5: Run Database Migrations (5 minutes)

### Option A: Via Render Shell (recommended)

1. Go to your Web Service → **Shell**
2. Run:
   ```bash
   node database/migrate.js
   ```
3. Verify output:
   ```
   🔄 Starting database migrations...
   📋 Found 1 migration file(s):
     ▶ Running: 001_init.sql
     ✅ Success: 001_init.sql
   🎉 All migrations completed successfully!
   ```

### Option B: Via Local Machine

```bash
# Set DATABASE_URL locally
export DATABASE_URL="postgresql://agrichain_user:password@dpg-xxxx.render.com:5432/agrichain360"

# Run migrations
node database/migrate.js
```

---

## Step 6: Configure Custom Domain (30 minutes)

### DNS Setup:

1. Go to your domain registrar (Namecheap, GoDaddy, etc.)
2. Add DNS records:

```
Type: CNAME
Name: @
Value: agrichain360-api.onrender.com

Type: CNAME
Name: www
Value: agrichain360-api.onrender.com

Type: CNAME
Name: api
Value: agrichain360-api.onrender.com
```

### Render Domain Setup:

1. Go to your Web Service → **Settings** → **Custom Domain**
2. Add: `agrichain360.com`
3. Add: `www.agrichain360.com`
4. Add: `api.agrichain360.com`
5. Render will auto-provision SSL certificate (Let's Encrypt)
6. Wait 5-10 minutes for DNS propagation

### Verify:

```bash
curl https://agrichain360.com/health
# Should return: {"success":true,"message":"AGRICHAIN 360™ is running",...}
```

---

## Step 7: Configure Monitoring (15 minutes)

### Sentry (Error Tracking):

1. Create account at https://sentry.io
2. Create project: `agrichain360-node`
3. Copy DSN
4. Add to Render environment: `SENTRY_DSN=[your DSN]`
5. Redeploy

### UptimeRobot (Uptime Monitoring):

1. Create account at https://uptimerobot.com
2. Add monitor:
   - **Type:** HTTP(s)
   - **URL:** `https://agrichain360.com/health`
   - **Interval:** 5 minutes
   - **Alert contacts:** your email + phone
3. Test alert by temporarily stopping the service

---

## Step 8: Run Smoke Tests (30 minutes)

### Test Health Check:

```bash
curl https://agrichain360.com/health
```

### Test Registration:

```bash
curl -X POST https://agrichain360.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Farmer",
    "phone": "+256700000001",
    "password": "TestPass123!",
    "role": "FARMER"
  }'
```

### Test Login:

```bash
curl -X POST https://agrichain360.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+256700000001",
    "password": "TestPass123!"
  }'
```

### Test Marketplace:

```bash
curl https://agrichain360.com/api/v1/marketplace/products
```

### Test Quality Passport:

```bash
curl https://agrichain360.com/passport/AGR-2026-TEST001
```

---

## Step 9: Go Live (5 minutes)

### Final Checklist:

- [ ] Health check returns 200 OK
- [ ] Database migrations complete
- [ ] SSL certificate active (HTTPS works)
- [ ] Monitoring configured (Sentry + UptimeRobot)
- [ ] Test registration works
- [ ] Test login works
- [ ] API endpoints respond
- [ ] No critical errors in Sentry

### Announce Launch:

1. Send email to pilot users: "AGRICHAIN 360 is live!"
2. Post on social media
3. Update website with live URL
4. Monitor Sentry for first 24 hours

---

## Rollback Procedure

If something goes wrong:

### Quick Rollback (Code):

```bash
# Revert last commit
git revert HEAD
git push origin main
# Render will auto-redeploy previous version
```

### Quick Rollback (Database):

1. Go to Render → PostgreSQL → **Backups**
2. Click **Restore** on the latest backup
3. Wait 5-10 minutes for restoration

### Emergency Stop:

1. Go to Render → Web Service → **Settings**
2. Click **Suspend Service**
3. Investigate issue
4. Fix and redeploy

---

**End of Runbook**
