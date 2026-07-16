# AGRICHAIN 360™ — Pre-Deployment Checklist

**Instructions:** Update status as you complete each item. Use ✅ for complete, ⬜ for pending, ❌ for blocked.

---

## A. SECURITY HARDENING

### P0 — Critical (Must Complete Before Launch)

| Status | Task | Est. Time | Notes |
|--------|------|-----------|-------|
| ⬜ | Generate secure JWT_SECRET (64-char random hex) | 5 min | Use: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| ⬜ | Generate secure SESSION_SECRET (64-char random hex) | 5 min | Same command as above |
| ⬜ | Generate PASSPORT_SECRET (32-char random hex) | 5 min | For QR code signing |
| ⬜ | Add express-validator to ALL POST/PUT endpoints | 2 days | Install: `npm install express-validator` |
| ⬜ | Add express-rate-limit (100 req/15min per IP) | 2 hours | Install: `npm install express-rate-limit` |
| ⬜ | Configure CORS for specific origins only | 1 hour | Update `server.js` |
| ⬜ | Add HTTPS enforcement (redirect HTTP → HTTPS) | 30 min | Add middleware |
| ⬜ | Add HSTS header (Strict-Transport-Security) | 30 min | Add to Helmet config |
| ⬜ | Mark cookies as Secure + HttpOnly | 30 min | Update session config |
| ⬜ | Remove .env from git (verify .gitignore) | 10 min | Already done ✅ |
| ⬜ | Add input sanitization (prevent XSS) | 2 hours | Use `express-validator` escape() |

**P0 Total:** ~3 days

### P1 — High Priority

| Status | Task | Est. Time | Notes |
|--------|------|-----------|-------|
| ⬜ | Add Sentry error tracking | 2 hours | Free tier: 5,000 errors/month |
| ⬜ | Add request logging (Winston) | 3 hours | Structured JSON logs |
| ⬜ | Add audit log table for critical actions | 4 hours | Track payments, role changes |
| ⬜ | Add database transactions for payments | 3 hours | Prevent partial updates |
| ⬜ | Add SQL injection testing (automated) | 2 hours | Use SQLMap |

**P1 Total:** ~2 days

---

## B. PAYMENT INTEGRATION

### P0 — Critical (Blocks Revenue)

| Status | Task | Est. Time | Notes |
|--------|------|-----------|-------|
| ⬜ | Register MTN Mobile Money API account | 1 day | https://momodeveloper.mtn.com |
| ⬜ | Register Airtel Money API account | 1 day | https://developers.airtel.africa |
| ⬜ | Integrate MTN MoMo collection API | 1 day | Add to `payment.service.js` |
| ⬜ | Integrate Airtel Money collection API | 1 day | Add to `payment.service.js` |
| ⬜ | Add webhook handlers for payment callbacks | 4 hours | `/api/v1/payments/callback/mtn` |
| ⬜ | Test payment flow end-to-end (UGX 1000 test) | 2 hours | Use sandbox environment |
| ⬜ | Remove subscription auto-confirmation bypass | 1 hour | Fix `subscription.service.js` line 38-44 |
| ⬜ | Add payment failure handling + retry logic | 3 hours | Handle timeouts, network errors |

**P0 Total:** ~6 days

### P1 — High Priority

| Status | Task | Est. Time | Notes |
|--------|------|-----------|-------|
| ⬜ | Add PDF invoice generation (pdfkit) | 1 day | Install: `npm install pdfkit` |
| ⬜ | Add email delivery (SendGrid/Postmark) | 4 hours | Free tier: 100 emails/day |
| ⬜ | Add invoice storage (S3/MinIO) | 3 hours | Use Render storage or AWS S3 |
| ⬜ | Add invoice download endpoint | 2 hours | `GET /api/v1/invoices/:id/download` |

**P1 Total:** ~3 days

---

## C. INFRASTRUCTURE SETUP

### P0 — Critical

| Status | Task | Est. Time | Notes |
|--------|------|-----------|-------|
| ⬜ | Create Render.com account | 30 min | https://render.com |
| ⬜ | Provision managed PostgreSQL (10GB) | 30 min | $7/month |
| ⬜ | Deploy backend as web service | 2 hours | Connect GitHub repo |
| ⬜ | Configure custom domain (agrichain360.com) | 1 hour | Update DNS records |
| ⬜ | Enable SSL certificate (Let's Encrypt) | 30 min | Auto-provisioned by Render |
| ⬜ | Set up environment variables in Render | 1 hour | Copy from `.env.production` |
| ⬜ | Configure automated backups (daily) | 30 min | Enable in Render dashboard |
| ⬜ | Set up Sentry DSN in environment | 30 min | Create Sentry project |
| ⬜ | Set up UptimeRobot monitoring | 30 min | Free tier: 50 monitors |

**P0 Total:** ~1 day

---

## D. SMS + USSD INTEGRATION

### P0 — Critical

| Status | Task | Est. Time | Notes |
|--------|------|-----------|-------|
| ⬜ | Register Africa's Talking account | 1 hour | https://account.africastalking.com |
| ⬜ | Purchase SMS credits (UGX 100K = ~5,000 SMS) | 30 min | Via mobile money |
| ⬜ | Create notification service (`services/notification.service.js`) | 4 hours | Use `africastalking` npm package |
| ⬜ | Add SMS triggers for: booking confirmation, payment success, passport issued | 3 hours | Call `NotificationService.sendSMS()` |
| ⬜ | Test SMS delivery | 1 hour | Send test SMS to your phone |

**P0 Total:** ~2 days

### P1 — High Priority

| Status | Task | Est. Time | Notes |
|--------|------|-----------|-------|
| ⬜ | Reserve USSD code (*284#) via Africa's Talking | 1 day | Requires approval |
| ⬜ | Create USSD webhook endpoint (`/api/v1/ussd`) | 1 day | Handle multi-step menus |
| ⬜ | Implement USSD menu structure | 2 days | Register, prices, bookings |
| ⬜ | Test USSD flow (register, check prices, book service) | 1 day | Dial *284# on feature phone |

**P1 Total:** ~5 days

---

## E. TESTING & QA

### P0 — Critical

| Status | Test Scenario | Notes |
|--------|---------------|-------|
| ⬜ | Farmer registration → login → create profile | Via web + API |
| ⬜ | Partner registration → admin approval | Via web + API |
| ⬜ | Booking flow: farmer books → payment → partner confirms → complete | End-to-end |
| ⬜ | Quality Passport: lab tests → upload results → passport issued → QR generated | End-to-end |
| ⬜ | Subscription: buyer signs up → selects Pro plan → pays → dashboard unlocks | End-to-end |
| ⬜ | Marketplace: farmer lists produce → buyer searches → buyer contacts | End-to-end |
| ⬜ | SMS notifications: booking confirmed → SMS sent → farmer receives | Via Africa's Talking |
| ⬜ | USSD registration: dial *284# → register → verify in database | Via Africa's Talking |

**P0 Total:** ~2 days

### P1 — High Priority

| Status | Test | Tool | Notes |
|--------|------|------|-------|
| ⬜ | SQL Injection | SQLMap | Test all POST endpoints |
| ⬜ | XSS | OWASP ZAP | Test all input fields |
| ⬜ | Rate Limiting | curl loop (1000 requests) | Verify 429 response |
| ⬜ | JWT Forgery | jwt.io | Test invalid signatures |
| ⬜ | CORS | Test from unauthorized origin | Verify 403 response |
| ⬜ | HTTPS | SSL Labs | Aim for A+ rating |

**P1 Total:** ~2 days

---

## F. PRODUCTION LAUNCH

### Pre-Launch (Day Before)

| Status | Task | Notes |
|--------|------|-------|
| ⬜ | Run database migrations on production | `node database/migrate.js` |
| ⬜ | Verify all environment variables set | Check Render dashboard |
| ⬜ | Test health check endpoint | `curl https://agrichain360.com/health` |
| ⬜ | Test payment flow with real MTN MoMo (UGX 100) | Refund after test |
| ⬜ | Test SMS delivery | Send to your phone |
| ⬜ | Test USSD menu | Dial *284# |
| ⬜ | Verify monitoring (Sentry + UptimeRobot) | Check dashboards |
| ⬜ | Seed database with sample data (50 farmers, 20 listings, 10 passports) | Use seed script |

### Launch Day

| Status | Task | Notes |
|--------|------|-------|
| ⬜ | Deploy production backend | `git push origin main` |
| ⬜ | Monitor Sentry for first 2 hours | Watch for errors |
| ⬜ | Monitor UptimeRobot | Verify 100% uptime |
| ⬜ | Send launch email to pilot users | "AGRICHAIN 360 is live!" |
| ⬜ | Post on social media | LinkedIn, Twitter |
| ⬜ | Celebrate! 🎉 | You did it! |

---

## G. POST-LAUNCH (Week 1)

| Status | Task | Notes |
|--------|------|-------|
| ⬜ | Monitor platform daily for bugs | Check Sentry daily |
| ⬜ | Fix critical issues immediately | Prioritize P0 bugs |
| ⬜ | Collect feedback from pilot users | Email/WhatsApp survey |
| ⬜ | Onboard 10 pilot farmers | Friends, partners |
| ⬜ | Onboard 2 service partners | Dryers, labs |
| ⬜ | Identify 5 target enterprise customers | Research exporters |
| ⬜ | Send personalized outreach emails | Use onboarding script |
| ⬜ | Schedule demo calls | 30-minute demos |
| ⬜ | Close first paying customer | Offer 1-month free trial |

---

## SUCCESS CRITERIA

### Production-Ready Checklist

- [ ] 100% of P0 security fixes complete
- [ ] Payment integration working (MTN MoMo + Airtel Money)
- [ ] SMS notifications working
- [ ] USSD gateway functional
- [ ] Website, mobile app, USSD all tested
- [ ] 1 end-to-end transaction completed
- [ ] Platform survives 24 hours with zero critical errors
- [ ] Monitoring active (Sentry + UptimeRobot)
- [ ] Backups configured and tested
- [ ] Solo founder can deploy updates in < 30 minutes
- [ ] Rollback procedure tested and documented

### Revenue-Ready Checklist

- [ ] First paying customer onboarded
- [ ] Invoice sent and payment received
- [ ] Customer successfully using platform
- [ ] Support process working
- [ ] Metrics dashboard showing activity
- [ ] Customer agrees to case study

---

## TIMELINE SUMMARY

| Phase | Duration | Focus |
|-------|----------|-------|
| **Week 1-2** | Days 1-14 | Security hardening + Payment integration + Infrastructure |
| **Week 3** | Days 15-21 | Testing + QA + Bug fixes |
| **Week 4** | Days 22-28 | Staging deployment + Soft launch |
| **Week 5** | Days 29-35 | Production launch + First customer onboarding |

**Total Time to Launch:** 5 weeks (35 days)

---

**End of Checklist**
