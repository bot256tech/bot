# AGRICHAIN 360™ — Emergency Playbook

**Purpose:** Step-by-step recovery procedures for common production incidents.

---

## Incident Severity Levels

| Level | Response Time | Examples |
|-------|---------------|----------|
| **P0 — Critical** | < 1 hour | Platform down, data breach, payment system broken |
| **P1 — High** | < 4 hours | SMS failing, slow performance, single feature broken |
| **P2 — Medium** | < 24 hours | Non-critical bug, UI issue, minor data inconsistency |
| **P3 — Low** | < 1 week | Cosmetic issue, feature request, documentation update |

---

## SCENARIO 1: Database Connection Failed

**Severity:** P0 — Critical  
**Symptoms:**
- Health check shows `database: disconnected`
- API returns 503 on database-dependent routes
- Sentry alerts: "PostgreSQL connection refused"

**Immediate Actions (0-15 minutes):**

1. **Check Render Dashboard:**
   - Go to https://render.com → PostgreSQL
   - Check status: Is it "Available" or "Maintenance"?
   - Check metrics: CPU, memory, connections

2. **Check Connection Limits:**
   ```bash
   # Via Render Shell
   psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
   ```
   - If connections > 18 (out of 20 max), there's a connection leak

3. **Restart Web Service:**
   - Go to Render → Web Service → **Manual Deploy** → **Deploy latest commit**
   - This will reset all database connections

**Recovery Actions (15-60 minutes):**

4. **If Database is Down:**
   - Contact Render support: support@render.com
   - Check Render status page: https://status.render.com
   - Wait for Render to restore (usually < 30 minutes)

5. **If Connection Leak:**
   ```bash
   # Kill idle connections
   psql $DATABASE_URL -c "
     SELECT pg_terminate_backend(pid) 
     FROM pg_stat_activity 
     WHERE state = 'idle' 
     AND query_start < NOW() - INTERVAL '10 minutes';
   "
   ```

6. **Verify Recovery:**
   ```bash
   curl https://agrichain360.com/health
   # Should show: "database": "connected"
   ```

**Post-Incident:**
- [ ] Document root cause in incident log
- [ ] Add connection pool monitoring alert
- [ ] Consider adding PgBouncer for connection pooling

---

## SCENARIO 2: Payment Gateway Down (MTN MoMo)

**Severity:** P1 — High  
**Symptoms:**
- Payment initiation fails
- Webhook callbacks not received
- Customers report "payment stuck"

**Immediate Actions (0-30 minutes):**

1. **Check MTN MoMo Status:**
   - Visit: https://momodeveloper.mtn.com/status
   - Check if sandbox/production is down

2. **Switch to Airtel Money (if available):**
   - Temporarily disable MTN MoMo in frontend
   - Enable Airtel Money as primary payment method
   - Update website banner: "MTN MoMo temporarily unavailable. Please use Airtel Money."

3. **Manual Payment Recording:**
   If customer paid but system didn't record:
   ```bash
   # Via Render Shell
   psql $DATABASE_URL -c "
     UPDATE payments 
     SET status = 'PAID', 
         transaction_id = 'MANUAL-[customer_phone]-[date]',
         paid_at = NOW()
     WHERE id = [payment_id];
     
     UPDATE bookings 
     SET status = 'CONFIRMED', 
         payment_status = 'PAID'
     WHERE id = [booking_id];
   "
   ```

**Recovery Actions (30 minutes - 4 hours):**

4. **Contact MTN Support:**
   - Email: momobusiness@mtn.com
   - Phone: +256 XXX XXXXXX
   - Provide: API user ID, timestamp of failed transactions

5. **Check Webhook Logs:**
   ```bash
   # Via Render Logs
   grep "payments/callback/mtn" | tail -50
   ```

6. **Retry Failed Webhooks:**
   ```javascript
   // Manual script to reprocess pending payments
   const pendingPayments = await Payment.findByStatus('PENDING');
   for (const payment of pendingPayments) {
     // Check MTN API for actual status
     const status = await checkMTNPaymentStatus(payment.transaction_id);
     if (status === 'SUCCESSFUL') {
       await PaymentService.confirmPayment(payment.id, payment.transaction_id, 'MTN_MOMO');
     }
   }
   ```

**Post-Incident:**
- [ ] Document which payments were affected
- [ ] Manually reconcile all stuck payments
- [ ] Add payment gateway health check to monitoring
- [ ] Consider adding backup payment provider

---

## SCENARIO 3: Mobile App Crashes on Startup

**Severity:** P1 — High  
**Symptoms:**
- Users report app crashes immediately after opening
- Crash reports in Firebase Crashlytics
- 1-star reviews on app store

**Immediate Actions (0-1 hour):**

1. **Check Crash Logs:**
   - Firebase Console → Crashlytics
   - Identify most common crash stack trace

2. **Check API Health:**
   ```bash
   curl https://agrichain360.com/health
   curl https://agrichain360.com/api/v1/auth/login -X POST -H "Content-Type: application/json" -d '{"phone":"test","password":"test"}'
   ```
   - If API is down, app will crash on network request

3. **Rollback App (if recent release):**
   - **Android:** Go to Google Play Console → Release → **Rollback to previous version**
   - **iOS:** Go to App Store Connect → TestFlight → **Expire current build**, promote previous build

**Recovery Actions (1-4 hours):**

4. **If API is Down:**
   - Follow SCENARIO 1 (Database Connection Failed)
   - Once API is back, app should work

5. **If App Bug:**
   - Identify the bug from crash logs
   - Fix locally and test
   - Build new version
   - Submit to app stores (expedited review if critical)
   - Notify users via in-app message: "Update available to fix crash"

6. **Temporary Workaround:**
   - Add banner on website: "Mobile app temporarily unavailable. Please use web version."
   - Send SMS to app users: "AGRICHAIN 360: App update available. Please update from app store."

**Post-Incident:**
- [ ] Document root cause
- [ ] Add pre-release testing checklist
- [ ] Consider staged rollout (10% → 50% → 100%)
- [ ] Add crash-free users metric to monitoring

---

## SCENARIO 4: SMS Gateway Failing (Africa's Talking)

**Severity:** P1 — High  
**Symptoms:**
- SMS notifications not delivered
- USSD menu not responding
- Sentry alerts: "SMS send failed"

**Immediate Actions (0-30 minutes):**

1. **Check Africa's Talking Dashboard:**
   - Login to https://account.africastalking.com
   - Check: SMS credits balance, delivery reports, API logs

2. **Check SMS Credits:**
   - If balance < UGX 10,000, top up immediately
   - Minimum top-up: UGX 50,000

3. **Test SMS Manually:**
   ```bash
   curl -X POST https://api.africastalking.com/version1/messaging \
     -H "apikey: [your_api_key]" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=[your_username]&to=+256700000001&message=Test&from=AGRICHAIN"
   ```

**Recovery Actions (30 minutes - 2 hours):**

4. **If Credits Exhausted:**
   - Top up via mobile money or bank transfer
   - Wait 5-10 minutes for credits to reflect
   - Retry failed SMS queue

5. **If API Key Invalid:**
   - Regenerate API key in Africa's Talking dashboard
   - Update Render environment: `AFRICAS_TALKING_API_KEY=[new_key]`
   - Redeploy

6. **If Africa's Talking is Down:**
   - Check status: https://status.africastalking.com
   - Contact support: support@africastalking.com
   - Temporary: Disable SMS notifications, use email fallback

**Post-Incident:**
- [ ] Document failed SMS count
- [ ] Retry all failed SMS (if critical)
- [ ] Add SMS credit balance alert (notify when < UGX 20,000)
- [ ] Consider backup SMS provider (Twilio)

---

## SCENARIO 5: Security Breach (Suspected)

**Severity:** P0 — Critical  
**Symptoms:**
- Unusual login attempts from foreign IPs
- Database records modified unexpectedly
- Sentry alerts: "JWT verification failed" (high volume)
- Customer reports unauthorized access

**Immediate Actions (0-15 minutes):**

1. **Suspend Service:**
   - Go to Render → Web Service → **Suspend Service**
   - This stops all incoming requests

2. **Rotate All Secrets:**
   ```bash
   # Generate new secrets
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   - Update: JWT_SECRET, SESSION_SECRET, PASSPORT_SECRET
   - Update Render environment variables
   - Redeploy

3. **Invalidate All Sessions:**
   ```bash
   psql $DATABASE_URL -c "DELETE FROM sessions;"
   ```

4. **Reset All User Passwords:**
   ```bash
   psql $DATABASE_URL -c "
     UPDATE users 
     SET password_hash = NULL, 
         status = 'PENDING'
     WHERE role != 'ADMIN';
   "
   ```
   - Users will need to reset passwords via "Forgot Password" flow

**Recovery Actions (15 minutes - 4 hours):**

5. **Investigate Breach:**
   - Check Sentry logs for suspicious activity
   - Check database audit logs (if enabled)
   - Identify which accounts were compromised
   - Identify what data was accessed/modified

6. **Restore from Backup (if data corrupted):**
   - Go to Render → PostgreSQL → **Backups**
   - Restore latest backup before breach
   - Verify data integrity

7. **Notify Affected Users:**
   - Send email: "Security Alert: Your AGRICHAIN 360 account may have been compromised. Please reset your password immediately."
   - Provide instructions for password reset
   - Offer support contact for questions

8. **Resume Service:**
   - Once investigation complete and fixes applied
   - Unsuspend service in Render
   - Monitor closely for 24 hours

**Post-Incident:**
- [ ] Document breach details (timeline, impact, root cause)
- [ ] File police report if required (Uganda Data Protection Act)
- [ ] Notify Personal Data Protection Office (if personal data breached)
- [ ] Add additional security measures (2FA, IP whitelisting)
- [ ] Conduct security audit

---

## SCENARIO 6: Disk Space Full (Database)

**Severity:** P1 — High  
**Symptoms:**
- Database writes fail: "no space left on device"
- Sentry alerts: "disk usage > 90%"
- New bookings, payments, registrations fail

**Immediate Actions (0-30 minutes):**

1. **Check Disk Usage:**
   ```bash
   psql $DATABASE_URL -c "
     SELECT 
       pg_size_pretty(pg_database_size('agrichain360')) AS db_size,
       pg_size_pretty(pg_total_relation_size('sessions')) AS sessions_size,
       pg_size_pretty(pg_total_relation_size('payments')) AS payments_size;
   "
   ```

2. **Clean Up Old Sessions:**
   ```bash
   psql $DATABASE_URL -c "
     DELETE FROM sessions 
     WHERE expire < NOW() - INTERVAL '30 days';
   "
   ```

3. **Vacuum Database:**
   ```bash
   psql $DATABASE_URL -c "VACUUM FULL;"
   ```

**Recovery Actions (30 minutes - 2 hours):**

4. **Upgrade Database Plan:**
   - Go to Render → PostgreSQL → **Settings**
   - Upgrade from Starter (10GB) to Pro (100GB)
   - Cost: $15/month → $50/month
   - Wait 10-15 minutes for upgrade

5. **Archive Old Data:**
   ```bash
   # Move old payments to archive table
   psql $DATABASE_URL -c "
     CREATE TABLE payments_archive AS 
     SELECT * FROM payments 
     WHERE created_at < NOW() - INTERVAL '2 years';
     
     DELETE FROM payments 
     WHERE created_at < NOW() - INTERVAL '2 years';
   "
   ```

**Post-Incident:**
- [ ] Add disk usage alert (notify at 80%, 90%, 95%)
- [ ] Implement data retention policy (auto-delete old records)
- [ ] Schedule monthly VACUUM

---

## SCENARIO 7: DDoS Attack (Rate Limiting Bypassed)

**Severity:** P0 — Critical  
**Symptoms:**
- Server CPU at 100%
- Response times > 10 seconds
- Legitimate users cannot access platform
- Render alerts: "high CPU usage"

**Immediate Actions (0-15 minutes):**

1. **Enable Cloudflare (if not already):**
   - Sign up at https://cloudflare.com
   - Add domain: agrichain360.com
   - Change DNS nameservers to Cloudflare
   - Enable "Under Attack" mode

2. **Increase Rate Limiting:**
   ```javascript
   // Temporary: stricter rate limit
   const apiLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 20,  // Reduced from 100
     message: 'Too many requests. Please try again later.'
   });
   ```

3. **Scale Up Server:**
   - Go to Render → Web Service → **Settings**
   - Upgrade from Starter to Pro (2x CPU, 2x memory)
   - Wait 5 minutes for scaling

**Recovery Actions (15 minutes - 2 hours):**

4. **Identify Attack Source:**
   ```bash
   # Check logs for suspicious IPs
   grep "POST /api/v1/auth/login" | awk '{print $1}' | sort | uniq -c | sort -rn | head -20
   ```

5. **Block Malicious IPs:**
   ```bash
   # Add to Cloudflare firewall rules
   # Block IP: 123.45.67.89
   ```

6. **Contact Render Support:**
   - Email: support@render.com
   - Subject: "DDoS Attack - Urgent"
   - Provide: timestamps, affected endpoints

**Post-Incident:**
- [ ] Document attack details (duration, source IPs, impact)
- [ ] Keep Cloudflare enabled permanently
- [ ] Add DDoS protection service (Cloudflare Pro: $20/month)
- [ ] Implement CAPTCHA on login/register

---

## Emergency Contacts

| Service | Contact | Response Time |
|---------|---------|---------------|
| **Render Support** | support@render.com | < 4 hours |
| **Africa's Talking** | support@africastalking.com | < 8 hours |
| **MTN MoMo** | momobusiness@mtn.com | < 24 hours |
| **Sentry** | support@sentry.io | < 24 hours |
| **Domain Registrar** | [your registrar] | < 24 hours |

---

## Incident Log Template

```markdown
## Incident #[number]: [Brief Description]

**Date:** YYYY-MM-DD HH:MM UTC  
**Severity:** P0/P1/P2/P3  
**Duration:** [start time] to [end time]  
**Affected Services:** [list]  
**Impact:** [number of users affected, revenue impact]

### Timeline
- HH:MM - First alert received
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Fix applied
- HH:MM - Service restored
- HH:MM - Monitoring confirmed recovery

### Root Cause
[Detailed explanation]

### Resolution
[Steps taken to fix]

### Prevention
[Measures to prevent recurrence]

### Lessons Learned
[What went well, what could improve]
```

---

**End of Emergency Playbook**
