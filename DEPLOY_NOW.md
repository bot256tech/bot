# AGRICHAIN 360™ — Deploy NOW (No External APIs Needed)

**Everything works in sandbox mode. Deploy today, add real payment APIs when revenue comes in.**

---

## What You Have RIGHT NOW (Working)

```
✅ User registration + login (JWT)
✅ Farmer, Buyer, Partner profiles
✅ Marketplace (list, search, browse produce)
✅ Digital Quality Passport (issue, verify, QR codes)
✅ Service bookings (drying, testing, transport)
✅ Payments (simulated — auto-confirm in sandbox)
✅ Subscriptions (FREE_TRIAL works, paid plans simulate payment)
✅ Buyer dashboard (supplier search, quality data)
✅ Admin revenue tracking
✅ SMS notifications (logged to console)
✅ WebSocket IoT monitoring
✅ Public passport verification page (/passport/:batchId)
```

## What You Need to Add LATER (When Revenue Allows)

```
⏳ MTN MoMo API ($0 to register, pay per transaction)
⏳ Airtel Money API ($0 to register, pay per transaction)
⏳ Africa's Talking SMS (~$10 for 5,000 SMS credits)
⏳ Africa's Talking USSD (*284# shortcode)
```

**Bottom line:** You can deploy TODAY and start onboarding users. When a customer wants to pay, you collect payment manually (bank transfer or cash) and confirm it in the admin panel. Later, add real payment APIs.

---

## STEP 1: Push to GitHub (5 minutes)

Open PowerShell in your project folder:

```powershell
cd C:\Users\techi\agrichain360-live

# Remove the .env from git (secrets should NOT be in git)
git rm --cached .env 2>$null

# Commit everything
git add -A
git commit -m "Production-ready: Deploy with sandbox payment mode"
git push origin main
```

If GitHub asks for credentials, use a Personal Access Token:
1. Go to https://github.com/settings/tokens
2. Generate new token → Select `repo` scope
3. Copy the token and use it as password when pushing

---

## STEP 2: Deploy to Render.com (15 minutes)

### 2a. Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (easiest)
3. Verify your email

### 2b. Create PostgreSQL Database

1. Click **"New +"** → **"PostgreSQL"**
2. Fill in:
   - **Name:** `agrichain360-db`
   - **Database:** `agrichain360`
   - **User:** `agrichain_admin`
   - **Region:** Frankfurt (closest to Uganda)
   - **Plan:** Free (90 days) → then $7/month
3. Click **"Create Database"**
4. Wait 2-3 minutes
5. Copy the **"Internal Connection String"**:
   ```
   postgresql://agrichain_admin:xxxx@dpg-xxxxxx.render.com:5432/agrichain360
   ```

### 2c. Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `bot256tech/bot`
3. Configure:
   ```
   Name:        agrichain360
   Region:      Frankfurt
   Branch:      main
   Build Command:  npm install
   Start Command:  npm start
   Environment:    Node
   Plan:           Free (spins down after 15 min) → or Starter ($7/month)
   ```

4. Add **Environment Variables** (click "Add Environment Variable"):

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | *(paste the Internal Connection String from 2b)* |
   | `JWT_SECRET` | `c94366cdcffd5abec22c005e3633a5a7f540430bd74dce5303c91ee7c27c5a07dfaa6d52c85e0df9d1f56145e23fc85c1ef0ebaee10254d0fb290b7a92b00df7` |
   | `SESSION_SECRET` | `70a009dcac0ded4b0ce2ebe3e6bcd0a67447b247d44496d63772d021d7daeeb0952fb68bdd3df6184fbbde3af3b64673e42c173e92b930c3b83df4d8a303c0d7` |
   | `PASSPORT_SECRET` | `bb636e2b4e6905b0d904c6d126d89a233c21031fca1264207b171cc4136017fe` |
   | `ALLOWED_ORIGINS` | `https://agrichain360.com,https://agrichain360.onrender.com` |
   | `PAYMENT_COMMISSION_RATE` | `0.10` |
   | `LOG_LEVEL` | `info` |

5. Click **"Create Web Service"**
6. Wait 3-5 minutes for build + deploy

### 2d. Run Database Migrations

Once the service is running:

1. Go to your Web Service → **"Shell"** (in the top menu)
2. Run:
   ```bash
   node database/migrate.js
   ```
3. You should see:
   ```
   🔄 Starting database migrations...
   ✅ Success: 001_init.sql
   ✅ Success: 002_audit_logs.sql
   🎉 All migrations completed successfully!
   ```

### 2e. Verify Deployment

1. Visit `https://agrichain360.onrender.com/health`
2. You should see:
   ```json
   {
     "success": true,
     "message": "AGRICHAIN 360™ is running",
     "version": "3.0.0",
     "services": {
       "database": "connected",
       "api": "active",
       "web": "active",
       "websocket": "active"
     }
   }
   ```

3. Visit `https://agrichain360.onrender.com/` to see the landing page

---

## STEP 3: Test the Platform (10 minutes)

### Test Registration

Visit `https://agrichain360.onrender.com/signup` and register as a farmer.

Or use the API:
```bash
curl -X POST https://agrichain360.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Farmer",
    "phone": "+256700123456",
    "password": "Test123!",
    "role": "FARMER",
    "profile": {
      "district": "Mayuge",
      "village": "Buwoola",
      "crops": ["Maize", "Coffee"],
      "farm_size": 3.5
    }
  }'
```

### Test Login
```bash
curl -X POST https://agrichain360.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+256700123456",
    "password": "Test123!"
  }'
```

### Test Marketplace
```bash
curl https://agrichain360.onrender.com/api/v1/marketplace/products
```

### Test Subscription Plans
```bash
curl https://agrichain360.onrender.com/api/v1/subscriptions/plans
```

---

## STEP 4: Manual Payment Workflow (Until APIs Are Ready)

When a buyer wants to subscribe to the Professional plan:

### Step 1: Buyer subscribes (API call or website)
```
POST /api/v1/subscriptions/subscribe
{
  "plan_name": "PROFESSIONAL",
  "billing_cycle": "MONTHLY",
  "payment_method": "BANK_TRANSFER"
}
```

Response:
```json
{
  "success": true,
  "message": "Subscription created. Complete payment to activate Professional.",
  "data": {
    "subscription": { "id": 1, "status": "ACTIVE" },
    "payment": { "id": 1, "amount": 750000, "status": "PENDING" },
    "status": "AWAITING_PAYMENT"
  }
}
```

### Step 2: Collect payment manually
Send the buyer your bank details or Mobile Money number:
```
AGRICHAIN 360
Bank: Stanbic Bank Uganda
Account: XXXXXXXXXX
Amount: UGX 750,000
Reference: SUB-1
```

### Step 3: Confirm payment (admin API)
Once you receive the money:
```bash
curl -X POST https://agrichain360.onrender.com/api/v1/payments/confirm/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "BANK-TRANSFER-20260716",
    "provider": "STANBIC_BANK"
  }'
```

This marks the payment as PAID and the subscription becomes fully active.

---

## STEP 5: Custom Domain (Optional — $15/year)

If you have `agrichain360.com`:

1. Go to Render → Web Service → **Settings** → **Custom Domain**
2. Add: `agrichain360.com`
3. Render will give you DNS instructions
4. Go to your domain registrar and add:
   ```
   Type: CNAME
   Name: @
   Value: agrichain360.onrender.com
   ```
5. Wait 5-30 minutes for DNS propagation
6. SSL certificate auto-provisions (Let's Encrypt)

---

## Cost Summary

| Item | Cost | Notes |
|------|------|-------|
| Render (web service) | $0 (free) or $7/mo | Free spins down after 15 min |
| Render (PostgreSQL) | $0 (90 days free) then $7/mo | 10GB storage |
| Domain | $15/year | agrichain360.com |
| External APIs | $0 | Sandbox mode, add later |
| **Month 1 Total** | **$0-14** | |
| **Month 4+ Total** | **$14/month** | After free tiers expire |

---

## When to Add Real Payment APIs

Add these when you have your first paying customer:

| Provider | Cost to Start | When to Add |
|----------|--------------|-------------|
| **MTN MoMo** | Free to register, 2-3% per transaction | First customer paying via MoMo |
| **Airtel Money** | Free to register, 2-3% per transaction | If customers use Airtel |
| **Africa's Talking SMS** | ~$10 for 5,000 SMS | When you need to notify farmers |
| **Africa's Talking USSD** | ~$30/month for shortcode | When farmers need *284# access |

**Total to add all APIs: ~$40 one-time + per-transaction fees**

---

## Your Immediate Action Plan

1. **Right now:** Push code to GitHub
2. **Next 15 minutes:** Deploy to Render.com
3. **Next 30 minutes:** Test registration + login + marketplace
4. **This week:** Onboard 10 pilot farmers (friends, local farmers)
5. **Next week:** Onboard 2 service partners (dryers, labs)
6. **Week 3:** Demo to first enterprise buyer
7. **Week 4:** Close first paying customer → use revenue to add real payment APIs

**You don't need any external APIs to start. Deploy today.**
