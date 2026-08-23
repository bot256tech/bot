# AGRICHAIN 360™ — Production Deployment Plan

**Version:** 1.0  
**Date:** 2026-07-16  
**Author:** Senior Technical Architect  
**Target:** Solo Founder + AI-Assisted Development

---

## Executive Summary

This deployment plan ensures AGRICHAIN 360™ launches as a **secure, scalable, revenue-ready platform** that a solo founder can maintain with minimal DevOps overhead.

**Platform Components:**
- **Website:** EJS + Express (farmer/buyer/partner dashboards)
- **Mobile App:** React Native (iOS/Android)
- **USSD Gateway:** *284# (Africa's Talking)
- **Backend API:** Node.js + PostgreSQL + JWT Auth
- **Payments:** MTN Mobile Money + Airtel Money
- **SMS Notifications:** Africa's Talking

**Deployment Strategy:**
- **Hosting:** Render.com (managed PostgreSQL + web service)
- **Cost:** ~$50/month (hosting + database + SMS credits)
- **Time to Launch:** 30 days (from audit completion)
- **Break-even:** 1 enterprise subscriber (UGX 750K/month)

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AGRICHAIN 360™ PLATFORM                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   WEBSITE    │  │  MOBILE APP  │  │  USSD GATE   │            │
│  │              │  │              │  │              │            │
│  │ EJS + Web    │  │ React Native │  │  *284#       │            │
│  │ Dashboard    │  │ iOS/Android  │  │  Feature     │            │
│  │              │  │              │  │  Phone       │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                 │                 │                     │
│         └─────────────────┴─────────────────┘                     │
│                           │                                       │
│                  ┌────────▼────────┐                              │
│                  │   REST API      │                              │
│                  │  /api/v1/*      │                              │
│                  │  JWT Auth       │                              │
│                  └────────┬────────┘                              │
│                           │                                       │
│         ┌─────────────────┼─────────────────┐                    │
│         │                 │                 │                    │
│    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐               │
│    │Database │      │WebSocket│      │  MQTT   │               │
│    │PostgreSQL│      │Socket.IO│      │ Gateway │               │
│    │         │      │         │      │         │               │
│    └─────────┘      └─────────┘      └─────────┘               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Hosting Stack:**
- **Backend:** Render Web Service (Docker container)
- **Database:** Render Managed PostgreSQL (10GB, automated backups)
- **CDN:** Render CDN (static assets)
- **SSL:** Let's Encrypt (auto-renewing)
- **Monitoring:** Sentry (errors) + UptimeRobot (uptime)
- **SMS/USSD:** Africa's Talking API

---

## Phase 1: Pre-Deployment Readiness (Days 1-14)

### 1.1 Security Hardening (Days 1-3)

#### P0: Critical Security Fixes

| Task | Est. Time | Status |
|------|-----------|--------|
| Generate secure JWT_SECRET (64-char random) | 5 min | ⬜ |
| Generate secure SESSION_SECRET (64-char random) | 5 min | ⬜ |
| Add express-validator to ALL POST/PUT endpoints | 2 days | ⬜ |
| Add express-rate-limit (100 req/15min per IP) | 2 hours | ⬜ |
| Configure CORS for specific origins only | 1 hour | ⬜ |
| Add HTTPS enforcement (redirect HTTP → HTTPS) | 30 min | ⬜ |
| Add HSTS header (Strict-Transport-Security) | 30 min | ⬜ |
| Mark cookies as Secure + HttpOnly | 30 min | ⬜ |
| Remove .env from git (verify .gitignore) | 10 min | ⬜ |
| Add input sanitization (prevent XSS) | 2 hours | ⬜ |

**Commands:**
```bash
# Generate secure secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Install validation + rate limiting
npm install express-validator express-rate-limit helmet
```

#### P1: Enhanced Security

| Task | Est. Time | Status |
|------|-----------|--------|
| Add Sentry error tracking | 2 hours | ⬜ |
| Add request logging (Winston) | 3 hours | ⬜ |
| Add audit log table for critical actions | 4 hours | ⬜ |
| Add database transaction support for payments | 3 hours | ⬜ |
| Add SQL injection testing (automated) | 2 hours | ⬜ |

---

### 1.2 Payment Integration (Days 4-7)

#### P0: Payment Gateway Setup

| Task | Est. Time | Status |
|------|-----------|--------|
| Register MTN Mobile Money API account | 1 day | ⬜ |
| Register Airtel Money API account | 1 day | ⬜ |
| Integrate MTN MoMo collection API | 1 day | ⬜ |
| Integrate Airtel Money collection API | 1 day | ⬜ |
| Add webhook handlers for payment callbacks | 4 hours | ⬜ |
| Test payment flow end-to-end (UGX 1000 test) | 2 hours | ⬜ |
| Remove subscription auto-confirmation bypass | 1 hour | ⬜ |
| Add payment failure handling + retry logic | 3 hours | ⬜ |

**MTN MoMo Integration Steps:**
1. Register at https://momodeveloper.mtn.com
2. Create API user + subscription key
3. Implement collection request:
   ```javascript
   const axios = require('axios');
   
   async function requestPayment(phone, amount, reference) {
     const response = await axios.post(
       'https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay',
       {
         amount: amount.toString(),
         currency: 'UGX',
         externalId: reference,
         payer: { partyIdType: 'MSISDN', partyId: phone },
         payerMessage: 'AGRICHAIN 360 Subscription',
         payeeNote: 'Thank you'
       },
       {
         headers: {
           'Authorization': `Bearer ${accessToken}`,
           'X-Reference-Id': uuidv4(),
           'X-Target-Environment': 'sandbox',
           'Ocp-Apim-Subscription-Key': process.env.MTN_SUBSCRIPTION_KEY
         }
       }
     );
     return response.data;
   }
   ```

4. Add webhook endpoint:
   ```javascript
   router.post('/api/v1/payments/callback/mtn', async (req, res) => {
     const { externalId, status, payer } = req.body;
     
     if (status === 'SUCCESSFUL') {
       await PaymentService.confirmPayment(externalId, req.body.transactionId, 'MTN_MOMO');
     } else {
       await PaymentService.failPayment(externalId);
     }
     
     res.status(200).send('OK');
   });
   ```

#### P1: Invoice Generation

| Task | Est. Time | Status |
|------|-----------|--------|
| Add PDF invoice generation (pdfkit) | 1 day | ⬜ |
| Add email delivery (SendGrid/Postmark) | 4 hours | ⬜ |
| Add invoice storage (S3/MinIO) | 3 hours | ⬜ |
| Add invoice download endpoint | 2 hours | ⬜ |

---

### 1.3 Infrastructure Setup (Days 8-10)

#### P0: Hosting Configuration

| Task | Est. Time | Status |
|------|-----------|--------|
| Create Render.com account | 30 min | ⬜ |
| Provision managed PostgreSQL (10GB) | 30 min | ⬜ |
| Deploy backend as web service | 2 hours | ⬜ |
| Configure custom domain (agrichain360.com) | 1 hour | ⬜ |
| Enable SSL certificate (Let's Encrypt) | 30 min | ⬜ |
| Set up environment variables in Render | 1 hour | ⬜ |
| Configure automated backups (daily) | 30 min | ⬜ |
| Set up Sentry DSN in environment | 30 min | ⬜ |
| Set up UptimeRobot monitoring | 30 min | ⬜ |

**Render Deployment Steps:**
1. Push code to GitHub
2. Connect Render to GitHub repo
3. Create Web Service:
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment: Node 18
4. Create PostgreSQL database
5. Copy connection string to `DATABASE_URL` env var
6. Add all env vars from `.env.production` template
7. Deploy

---

### 1.4 SMS + USSD Integration (Days 11-14)

#### P0: SMS Notifications

| Task | Est. Time | Status |
|------|-----------|--------|
| Register Africa's Talking account | 1 hour | ⬜ |
| Purchase SMS credits (UGX 100K = ~5,000 SMS) | 30 min | ⬜ |
| Create notification service (services/notification.service.js) | 4 hours | ⬜ |
| Add SMS triggers for: booking confirmation, payment success, passport issued | 3 hours | ⬜ |
| Test SMS delivery | 1 hour | ⬜ |

**SMS Service Implementation:**
```javascript
// services/notification.service.js
const AfricasTalking = require('africastalking');

const at = AfricasTalking({
  apiKey: process.env.AFRICAS_TALKING_API_KEY,
  username: process.env.AFRICAS_TALKING_USERNAME
});

const sms = at.SMS;

class NotificationService {
  static async sendSMS(phone, message) {
    try {
      const result = await sms.send({
        to: [phone],
        message: message,
        from: 'AGRICHAIN'
      });
      console.log('SMS sent:', result);
      return result;
    } catch (error) {
      console.error('SMS failed:', error);
      throw error;
    }
  }

  static async notifyBookingConfirmed(booking) {
    const message = `AGRICHAIN 360: Your booking #${booking.id} is confirmed. Service: ${booking.service_type}. Date: ${booking.scheduled_date}. Contact partner for details.`;
    await this.sendSMS(booking.farmer_phone, message);
  }

  static async notifyPaymentSuccess(payment) {
    const message = `AGRICHAIN 360: Payment of UGX ${payment.amount} received. Transaction ID: ${payment.transaction_id}. Thank you!`;
    await this.sendSMS(payment.user_phone, message);
  }

  static async notifyPassportIssued(passport) {
    const message = `AGRICHAIN 360: Quality Passport issued for batch ${passport.batch_number}. Grade: ${passport.quality_grade}. View: agrichain360.com/passport/${passport.batch_number}`;
    await this.sendSMS(passport.farmer_phone, message);
  }
}

module.exports = NotificationService;
```

#### P1: USSD Gateway

| Task | Est. Time | Status |
|------|-----------|--------|
| Reserve USSD code (*284#) via Africa's Talking | 1 day | ⬜ |
| Create USSD webhook endpoint (/api/v1/ussd) | 1 day | ⬜ |
| Implement USSD menu structure | 2 days | ⬜ |
| Test USSD flow (register, check prices, book service) | 1 day | ⬜ |

**USSD Menu Structure:**
```
*284#
  1. Register as Farmer
  2. Check Market Prices
  3. Find Services (Drying/Testing)
  4. My Bookings
  5. Claim Offer
  6. Contact Support
```

**USSD Webhook Implementation:**
```javascript
// api/routes/ussd.routes.js
router.post('/api/v1/ussd', async (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;
  
  let response = '';
  
  if (text === '') {
    // Main menu
    response = `CON AGRICHAIN 360\n`;
    response += `1. Register as Farmer\n`;
    response += `2. Check Market Prices\n`;
    response += `3. Find Services\n`;
    response += `4. My Bookings\n`;
    response += `5. Claim Offer\n`;
    response += `6. Contact Support`;
  } else if (text === '1') {
    // Register - ask for name
    response = `CON Enter your full name:`;
  } else if (text.startsWith('1*')) {
    // Register - save name, ask for district
    const name = text.split('*')[1];
    // Save to session/database
    response = `CON Enter your district:`;
  }
  // ... more menu levels
  
  res.set('Content-Type', 'text/plain');
  res.send(response);
});
```

---

## Phase 2: Testing & Quality Assurance (Days 15-21)

### 2.1 Integration Testing (Days 15-17)

| Test Scenario | Steps | Status |
|---------------|-------|--------|
| **Farmer Registration** | Register via web → login → create profile → verify | ⬜ |
| **Partner Registration** | Register → create partner profile → admin approves | ⬜ |
| **Booking Flow** | Farmer books drying → payment → partner confirms → complete | ⬜ |
| **Quality Passport** | Lab tests → upload results → passport issued → QR generated | ⬜ |
| **Subscription** | Buyer signs up → selects Pro plan → pays → dashboard unlocks | ⬜ |
| **Marketplace** | Farmer lists produce → buyer searches → buyer contacts | ⬜ |
| **SMS Notifications** | Booking confirmed → SMS sent → farmer receives | ⬜ |
| **USSD Registration** | Dial *284# → register → verify in database | ⬜ |

### 2.2 Security Testing (Days 18-19)

| Test | Tool | Status |
|------|------|--------|
| SQL Injection | SQLMap | ⬜ |
| XSS | OWASP ZAP | ⬜ |
| Rate Limiting | curl loop (1000 requests) | ⬜ |
| JWT Forgery | jwt.io (test invalid signatures) | ⬜ |
| CORS | Test from unauthorized origin | ⬜ |
| HTTPS | SSL Labs test (aim for A+) | ⬜ |

### 2.3 Performance Testing (Days 20-21)

| Test | Target | Tool | Status |
|------|--------|------|--------|
| API Response Time | < 500ms (95th percentile) | Artillery | ⬜ |
| Concurrent Users | 100 simultaneous | Artillery | ⬜ |
| Database Queries | No query > 1s | pg_stat_statements | ⬜ |
| Memory Usage | < 512MB | Render dashboard | ⬜ |

**Artillery Load Test:**
```yaml
# load-test.yml
config:
  target: 'https://api.agrichain360.com'
  phases:
    - duration: 60
      arrivalRate: 10  # 10 users/second
scenarios:
  - flow:
      - get:
          url: '/api/v1/marketplace/products'
      - get:
          url: '/health'
```

---

## Phase 3: Staging Deployment (Days 22-24)

### 3.1 Staging Environment Setup

| Task | Est. Time | Status |
|------|-----------|--------|
| Create staging database (separate from production) | 30 min | ⬜ |
| Deploy staging backend (staging.agrichain360.com) | 2 hours | ⬜ |
| Seed staging database with sample data | 2 hours | ⬜ |
| Test all features in staging | 1 day | ⬜ |
| Fix any bugs found | 1 day | ⬜ |

**Sample Data Seeding:**
```sql
-- Seed 50 farmers
INSERT INTO users (name, phone, email, password_hash, role, status)
SELECT 
  'Farmer ' || i,
  '+25670000' || LPAD(i::text, 4, '0'),
  'farmer' || i || '@test.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'FARMER',
  'ACTIVE'
FROM generate_series(1, 50) AS i;

-- Seed 20 marketplace listings
INSERT INTO products (farmer_id, crop, quantity, price_per_unit, quality_status, available)
SELECT 
  (random() * 49 + 1)::int,
  (ARRAY['Maize', 'Coffee', 'Beans', 'Rice'])[floor(random() * 4 + 1)],
  (random() * 1000 + 100)::int,
  (random() * 5000 + 1000)::int,
  'APPROVED',
  true
FROM generate_series(1, 20);

-- Seed 10 quality passports
INSERT INTO quality_passports (batch_number, farmer_id, crop_type, quantity, moisture_level, aflatoxin_result, quality_grade, qr_code)
SELECT 
  'AGR-2026-' || LPAD(i::text, 6, '0'),
  (random() * 49 + 1)::int,
  'Maize',
  (random() * 1000 + 100)::int,
  (random() * 5 + 10)::decimal(5,2),
  (random() * 10)::decimal(6,2),
  (ARRAY['A', 'B', 'C'])[floor(random() * 3 + 1)],
  'https://agrichain360.com/passport/AGR-2026-' || LPAD(i::text, 6, '0')
FROM generate_series(1, 10) AS i;
```

---

## Phase 4: Production Deployment (Days 25-27)

### 4.1 Production Launch Checklist

| Task | Est. Time | Status |
|------|-----------|--------|
| Run database migrations on production | 30 min | ⬜ |
| Verify all environment variables set | 30 min | ⬜ |
| Deploy production backend | 1 hour | ⬜ |
| Configure custom domain DNS | 1 hour | ⬜ |
| Enable SSL certificate | 30 min | ⬜ |
| Test health check endpoint | 10 min | ⬜ |
| Test payment flow with real MTN MoMo (UGX 100) | 30 min | ⬜ |
| Test SMS delivery | 10 min | ⬜ |
| Test USSD menu | 30 min | ⬜ |
| Verify monitoring (Sentry + UptimeRobot) | 30 min | ⬜ |

**Production Deployment Commands:**
```bash
# 1. Run migrations
npm run migrate

# 2. Deploy to Render (automatic via GitHub push)
git push origin main

# 3. Verify deployment
curl https://agrichain360.com/health

# 4. Test payment
curl -X POST https://agrichain360.com/api/v1/payments/initiate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "method": "MOBILE_MONEY"}'
```

---

## Phase 5: Soft Launch & First Customer (Days 28-30)

### 5.1 Soft Launch (Days 28-29)

| Task | Status |
|------|--------|
| Invite 10 pilot farmers (friends, partners) | ⬜ |
| Onboard 2 service partners (dryers, labs) | ⬜ |
| Monitor platform daily for bugs | ⬜ |
| Fix critical issues immediately | ⬜ |
| Collect feedback from pilot users | ⬜ |

### 5.2 First Paying Customer (Day 30)

**Target:** 1 enterprise buyer subscription (Professional plan, UGX 750K/month)

**Sales Process:**
1. Identify 5 target customers (exporters, cooperatives, NGOs)
2. Send personalized email with demo link
3. Schedule 30-minute demo call
4. Offer 1-month free trial (Starter plan)
5. At trial end, convert to paid Professional plan
6. Collect payment via bank transfer or Mobile Money
7. Manually activate subscription (if payment gateway pending)

**Success Metrics:**
- Customer logs in at least 3 times in first week
- Customer searches for suppliers
- Customer downloads at least 1 quality certificate
- Customer provides feedback
- Customer agrees to case study

---

## Cost Breakdown (First 6 Months)

| Item | Monthly Cost | 6-Month Total |
|------|--------------|---------------|
| **Hosting (Render)** | $25 | $150 |
| **Database (Render PostgreSQL)** | $7 | $42 |
| **SMS Credits (Africa's Talking)** | $50 | $300 |
| **Domain + SSL** | $1.25 ($15/year) | $7.50 |
| **Monitoring (Sentry free tier)** | $0 | $0 |
| **Uptime Monitoring (UptimeRobot free)** | $0 | $0 |
| **Email (SendGrid free tier)** | $0 | $0 |
| **Total** | **$83.25** | **$499.50** |

**Revenue Target (Break-Even):**
- 1 Professional subscriber = UGX 750,000/month (~$200/month)
- **Break-even:** 1 customer by Month 3

---

## Success Criteria

### Production-Ready Checklist

✅ 100% of P0 security fixes complete  
✅ Payment integration working (MTN MoMo + Airtel Money)  
✅ SMS notifications working  
✅ USSD gateway functional  
✅ Website, mobile app, USSD all tested  
✅ 1 end-to-end transaction completed  
✅ Platform survives 24 hours with zero critical errors  
✅ Monitoring active (Sentry + UptimeRobot)  
✅ Backups configured and tested  
✅ Solo founder can deploy updates in < 30 minutes  
✅ Rollback procedure tested and documented  

### Revenue-Ready Checklist

✅ First paying customer onboarded  
✅ Invoice sent and payment received  
✅ Customer successfully using platform  
✅ Support process working  
✅ Metrics dashboard showing activity  
✅ Customer agrees to case study  

---

## Next Steps

1. **Review this plan** — Confirm timeline and priorities
2. **Start Phase 1** — Begin security hardening (Day 1)
3. **Track progress** — Update status checkboxes daily
4. **Adjust as needed** — Revise timeline based on actual velocity
5. **Celebrate milestones** — First payment, first customer, first month profitable

---

**End of Deployment Plan**
