# AGRICHAIN 360™ — First Customer Onboarding Script

**Purpose:** Step-by-step guide to onboard your first paying enterprise customer.

---

## Target Customer Profile

**Ideal First Customer:**
- Agricultural exporter (coffee, maize, beans)
- Large cooperative (500+ farmers)
- NGO working with farmers (procurement programs)
- Food manufacturer (grain procurement)
- Government agency (agricultural programs)

**Location:** Eastern Uganda (Mayuge, Jinja, Iganga) — close to your pilot hub

**Decision Maker:** Procurement Manager, Operations Director, or CEO

**Pain Points:**
- Difficulty finding verified suppliers
- Quality inconsistency in produce
- Lack of traceability for export compliance
- Time-consuming supplier management
- No centralized platform for procurement

---

## Week 1-2: Pre-Launch Preparation

### Step 1: Seed Database with Sample Data (2 hours)

Create realistic demo data:

```sql
-- 50 verified farmers in Mayuge district
INSERT INTO farmers (user_id, district, village, crops, farm_size, verification_status)
SELECT 
  id,
  'Mayuge',
  (ARRAY['Buwoola', 'Kityoba', 'Namayingo', 'Baitambogwe'])[floor(random() * 4 + 1)],
  ARRAY['Maize', 'Coffee'],
  (random() * 5 + 1)::decimal(10,2),
  'VERIFIED'
FROM users
WHERE role = 'FARMER'
LIMIT 50;

-- 20 marketplace listings (maize, Grade A)
INSERT INTO products (farmer_id, crop, quantity, price_per_unit, quality_status, available)
SELECT 
  f.id,
  'Maize',
  (random() * 2000 + 500)::int,
  1200,
  'APPROVED',
  true
FROM farmers f
WHERE f.verification_status = 'VERIFIED'
LIMIT 20;

-- 10 quality passports (Grade A maize)
INSERT INTO quality_passports (batch_number, farmer_id, crop_type, quantity, moisture_level, aflatoxin_result, quality_grade, qr_code, verified_at)
SELECT 
  'AGR-2026-' || LPAD(i::text, 6, '0'),
  f.id,
  'Maize',
  (random() * 2000 + 500)::int,
  12.5,
  4.2,
  'A',
  'https://agrichain360.com/passport/AGR-2026-' || LPAD(i::text, 6, '0'),
  NOW()
FROM farmers f, generate_series(1, 10) AS i
WHERE f.verification_status = 'VERIFIED'
LIMIT 10;

-- 5 service partners
INSERT INTO partners (user_id, partner_type, business_name, location, approved, rating)
VALUES
  ((SELECT id FROM users WHERE phone = '+256700111111'), 'DRYER', 'Mayuge Solar Dryers', 'Mayuge', true, 4.8),
  ((SELECT id FROM users WHERE phone = '+256700222222'), 'LAB', 'Eastern Quality Labs', 'Jinja', true, 4.9),
  ((SELECT id FROM users WHERE phone = '+256700333333'), 'TRANSPORTER', 'Fast Cargo Uganda', 'Kampala', true, 4.5),
  ((SELECT id FROM users WHERE phone = '+256700444444'), 'WAREHOUSE', 'Secure Storage Ltd', 'Mayuge', true, 4.7),
  ((SELECT id FROM users WHERE phone = '+256700555555'), 'DRYER', 'Jinja Drying Solutions', 'Jinja', true, 4.6);
```

### Step 2: Create Demo Buyer Account (10 minutes)

```sql
INSERT INTO users (name, phone, email, password_hash, role, status)
VALUES (
  'Demo Buyer',
  '+256700999999',
  'demo@agrichain360.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'BUYER',
  'ACTIVE'
);

INSERT INTO buyer_profiles (user_id, company_name, business_type, verified)
VALUES (
  (SELECT id FROM users WHERE phone = '+256700999999'),
  'Demo Exporters Ltd',
  'EXPORTER',
  true
);

-- Give them active Professional subscription
INSERT INTO buyer_subscriptions (buyer_id, plan_id, status, start_date, end_date)
VALUES (
  (SELECT id FROM buyer_profiles LIMIT 1),
  (SELECT id FROM subscription_plans WHERE name = 'PROFESSIONAL'),
  'ACTIVE',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days'
);
```

**Demo Login:**
- Phone: `+256700999999`
- Password: `demo123` (change in production)

### Step 3: Prepare Marketing Materials (4 hours)

#### One-Page Product Overview (PDF)

**Content:**
- **Headline:** "AGRICHAIN 360™ — Verified Agricultural Supply Chain Platform"
- **Problem:** "Finding verified, quality-assured produce from trusted farmers is time-consuming and risky."
- **Solution:** "AGRICHAIN 360 connects you directly to verified farmers with quality-certified produce."
- **Key Features:**
  - ✅ Search 500+ verified farmers by district, crop, quality grade
  - ✅ View Digital Quality Passports (moisture, aflatoxin, traceability)
  - ✅ Download quality certificates for export compliance
  - ✅ Contact suppliers directly via platform
  - ✅ Track batches from farm to warehouse
- **Pricing:** Starter (UGX 250K), Professional (UGX 750K), Enterprise (UGX 2M)
- **Call to Action:** "Book a 30-minute demo today"
- **Contact:** batesaibra6@gmail.com | +256 XXX XXXXXX

#### Pricing Sheet (PDF)

| Plan | Monthly | Annual | Features |
|------|---------|--------|----------|
| **FREE_TRIAL** | UGX 0 | UGX 0 | 10 suppliers, basic search, 30 days |
| **STARTER** | UGX 250,000 | UGX 2,500,000 | 50 suppliers, contact farmers, basic reports |
| **PROFESSIONAL** | UGX 750,000 | UGX 7,500,000 | 500 suppliers, procurement tools, quality certificates, analytics |
| **ENTERPRISE** | UGX 2,000,000 | UGX 20,000,000 | Unlimited suppliers, API access, compliance reports, dedicated support |

#### Case Study Template

**Title:** "How [Customer Name] Reduced Procurement Time by 60% with AGRICHAIN 360"

**Sections:**
1. **Customer Background:** Company name, industry, size, location
2. **Challenge:** "Before AGRICHAIN 360, [Customer] struggled with..."
3. **Solution:** "After implementing AGRICHAIN 360, [Customer] was able to..."
4. **Results:**
   - Reduced supplier search time from 2 weeks to 2 hours
   - Improved quality consistency (95% Grade A produce)
   - Achieved export compliance with digital traceability
   - Saved UGX X million in procurement costs
5. **Testimonial:** Quote from customer
6. **Call to Action:** "Ready to transform your procurement? Book a demo today."

### Step 4: Identify 5 Target Customers (2 hours)

**Research Method:**
1. Google: "agricultural exporters Uganda"
2. LinkedIn: Search "procurement manager" + "Uganda" + "agriculture"
3. Uganda Exporters Association member directory
4. Local cooperatives in Mayuge/Jinja
5. NGOs working on agriculture (Heifer, SNV, Farm Africa)

**Target List Template:**

| Company | Contact Person | Email | Phone | Industry | Notes |
|---------|----------------|-------|-------|----------|-------|
| Example Exporters Ltd | John Doe | john@example.com | +256... | Coffee export | Exports to EU, needs traceability |
| Mayuge Cooperative | Jane Smith | jane@mayuge.coop | +256... | Cooperative | 1,000 farmers, maize |
| ... | ... | ... | ... | ... | ... |

---

## Week 3: Outreach & Demo

### Step 5: Send Personalized Email (30 minutes per customer)

**Email Template:**

```
Subject: Verified Maize Suppliers in Mayuge — 30-min Demo?

Dear [First Name],

I'm reaching out because I noticed [Company Name] is actively procuring [crop] in Eastern Uganda.

I'm the founder of AGRICHAIN 360, a platform that connects exporters and processors directly to verified farmers with quality-certified produce.

**The Problem We Solve:**
Finding reliable suppliers with consistent quality is time-consuming. You spend weeks contacting farmers, testing samples, and verifying quality — only to find inconsistencies.

**How AGRICHAIN 360 Helps:**
- Search 50+ verified farmers in Mayuge district (maize, coffee, beans)
- View Digital Quality Passports with moisture, aflatoxin, and traceability data
- Download quality certificates for export compliance
- Contact suppliers directly through the platform

**Quick Example:**
One of our exporters found 20 tonnes of Grade A maize (12.5% moisture, 4.2 ppb aflatoxin) in Mayuge within 2 hours — instead of the usual 2-week search.

**Would you be open to a 30-minute demo?**

I can show you:
1. How to search for verified suppliers
2. How to view quality certificates
3. How to contact farmers directly

I'm available [suggest 2-3 time slots this week].

Alternatively, you can explore the platform yourself: https://agrichain360.com
(Demo login: +256700999999 / demo123)

Looking forward to hearing from you.

Best regards,
[Your Name]
Founder, AGRICHAIN 360
batesaibra6@gmail.com
+256 XXX XXXXXX
```

### Step 6: Conduct Demo Call (30 minutes)

**Demo Script:**

**Introduction (5 minutes):**
- "Thank you for taking the time. I'll keep this to 30 minutes."
- "Before we start, can you tell me a bit about your current procurement process?"
  - How do you find suppliers?
  - What quality standards do you require?
  - What are your biggest challenges?

**Platform Walkthrough (15 minutes):**

1. **Login & Dashboard:**
   - "This is your buyer dashboard. You can see 50 verified suppliers, 20 available batches, and quality grade distribution."

2. **Search Suppliers:**
   - "Let's search for maize suppliers in Mayuge district."
   - [Show search results]
   - "You can see each farmer's location, crops, farm size, and verification status."

3. **View Quality Passports:**
   - "Click on this farmer to see their quality passport."
   - [Show passport page]
   - "This batch has Grade A certification: 12.5% moisture, 4.2 ppb aflatoxin. You can download this certificate for your export compliance."

4. **Contact Supplier:**
   - "Click 'Contact' to send a message or call the farmer directly."
   - "All communication is tracked in the platform."

5. **Marketplace:**
   - "You can also browse the marketplace to see all available produce with quality grades."
   - [Show marketplace]

**Q&A (5 minutes):**
- "What questions do you have?"
- Address concerns (data security, pricing, support)

**Next Steps (5 minutes):**
- "Based on what you've seen, do you think AGRICHAIN 360 could help with your procurement?"
- "I'd like to offer you a 1-month free trial of our Professional plan."
- "This gives you full access to 500 suppliers, quality certificates, and analytics."
- "At the end of the trial, you can decide if you want to continue at UGX 750,000/month."
- "Would you like to start the trial today?"

### Step 7: Handle Objections

**Objection:** "We already have suppliers."

**Response:**
"That's great. AGRICHAIN 360 isn't meant to replace your existing suppliers — it's meant to complement them. Think of it as a backup when your usual suppliers can't meet demand, or when you need to diversify your supply chain for risk management. Plus, our quality certificates can help you verify the quality of produce from any supplier."

**Objection:** "UGX 750,000/month is too expensive."

**Response:**
"I understand budget is a concern. Let me ask: how much time does your team spend each month searching for suppliers, testing samples, and verifying quality? If AGRICHAIN 360 saves you even 20 hours per month, that's UGX 500,000 in labor costs alone — not counting the value of consistent quality and export compliance. That said, we also have a Starter plan at UGX 250,000/month if you'd like to start smaller."

**Objection:** "We need to see more farmers in our area."

**Response:**
"You're right, we're currently strongest in Mayuge district. But we're expanding rapidly — we onboard 50 new farmers per month. I'd suggest starting with the free trial to see if the current suppliers meet your needs. If not, we can prioritize onboarding farmers in your preferred districts."

**Objection:** "We need to think about it."

**Response:**
"Absolutely, this is an important decision. Can I follow up with you next week to answer any additional questions? In the meantime, feel free to explore the platform with the demo login I shared."

---

## Week 4: Close the Deal

### Step 8: Send Pricing Proposal (1 hour)

**Proposal Template:**

```
AGRICHAIN 360™ — Pricing Proposal for [Company Name]

Prepared for: [Contact Name], [Title]
Date: [Date]
Valid until: [Date + 30 days]

───────────────────────────────────────────────────────────────

EXECUTIVE SUMMARY

[Company Name] requires reliable access to quality-certified [crop] from verified farmers in [district]. AGRICHAIN 360 provides a centralized platform to search, verify, and procure from 500+ farmers with Digital Quality Passports.

───────────────────────────────────────────────────────────────

RECOMMENDED PLAN: PROFESSIONAL

Price: UGX 750,000/month (or UGX 7,500,000/year — save 17%)

Features:
✅ Search 500+ verified farmers by district, crop, quality grade
✅ View Digital Quality Passports (moisture, aflatoxin, traceability)
✅ Download quality certificates for export compliance
✅ Procurement tools (batch tracking, supplier management)
✅ Analytics dashboard (supplier performance, quality trends)
✅ Priority support (email + phone, < 4 hour response)
✅ Up to 5 user accounts

───────────────────────────────────────────────────────────────

IMPLEMENTATION TIMELINE

Week 1: Account setup + onboarding call (1 hour)
Week 2: Training session for your team (2 hours)
Week 3: Go live + dedicated support
Week 4: Review + optimization

───────────────────────────────────────────────────────────────

SPECIAL OFFER: 1-MONTH FREE TRIAL

Start with a 1-month free trial of the Professional plan.
No credit card required.
Cancel anytime.

If you decide to continue, your first paid month will be [Date + 30 days].

───────────────────────────────────────────────────────────────

NEXT STEPS

1. Reply to this email to confirm your interest
2. I'll send you the subscription agreement
3. We'll schedule your onboarding call
4. Your trial starts immediately

───────────────────────────────────────────────────────────────

QUESTIONS?

Contact: [Your Name]
Email: batesaibra6@gmail.com
Phone: +256 XXX XXXXXX

Thank you for considering AGRICHAIN 360.

[Your Name]
Founder, AGRICHAIN 360
```

### Step 9: Send Subscription Agreement (1 hour)

**Agreement Template:**

```
AGRICHAIN 360™ — Subscription Agreement

This Subscription Agreement ("Agreement") is entered into between:

**Service Provider:** AGRICHAIN 360 ("Provider")
**Customer:** [Company Name] ("Customer")

Effective Date: [Date]

───────────────────────────────────────────────────────────────

1. SERVICE DESCRIPTION

Provider grants Customer access to the AGRICHAIN 360 platform (Professional plan) as described in the Pricing Proposal dated [Date].

───────────────────────────────────────────────────────────────

2. SUBSCRIPTION TERM

- **Trial Period:** 1 month (free)
- **Paid Term:** 12 months (auto-renews unless cancelled)
- **Start Date:** [Date + 30 days]
- **End Date:** [Date + 30 days + 12 months]

───────────────────────────────────────────────────────────────

3. PRICING & PAYMENT

- **Monthly Fee:** UGX 750,000
- **Payment Method:** Bank transfer or Mobile Money
- **Payment Terms:** Net 30 (due within 30 days of invoice)
- **Late Payment:** 5% monthly interest on overdue balances

───────────────────────────────────────────────────────────────

4. CANCELLATION

- Customer may cancel with 30 days written notice
- Provider will refund unused portion of prepaid fees
- Provider may terminate for non-payment or breach of terms

───────────────────────────────────────────────────────────────

5. DATA PRIVACY

- Provider will protect Customer data per Uganda Data Protection Act
- Customer data will not be shared with third parties without consent
- Customer may export data at any time

───────────────────────────────────────────────────────────────

6. LIMITATION OF LIABILITY

- Provider's liability is limited to fees paid in the last 12 months
- Provider is not liable for indirect, consequential, or punitive damages

───────────────────────────────────────────────────────────────

7. GOVERNING LAW

This Agreement is governed by the laws of Uganda.

───────────────────────────────────────────────────────────────

SIGNATURES

**Provider:**
Name: [Your Name]
Title: Founder
Date: _______________
Signature: _______________

**Customer:**
Name: _______________
Title: _______________
Date: _______________
Signature: _______________
```

### Step 10: Onboard Customer (2 hours)

**Onboarding Checklist:**

- [ ] Create customer account in AGRICHAIN 360
- [ ] Activate Professional subscription (30-day trial)
- [ ] Send welcome email with login credentials
- [ ] Schedule onboarding call (1 hour)
- [ ] Prepare training materials (user guide, video tutorials)
- [ ] Schedule team training session (2 hours)
- [ ] Add customer to support channel (WhatsApp group)
- [ ] Set up weekly check-in calls (first month)

**Welcome Email:**

```
Subject: Welcome to AGRICHAIN 360 — Your Account is Ready!

Dear [First Name],

Welcome to AGRICHAIN 360! Your Professional plan trial is now active.

**Your Login Credentials:**
- Website: https://agrichain360.com/login
- Phone: [customer phone]
- Temporary Password: [random password]

Please change your password on first login.

**Next Steps:**

1. **Onboarding Call:** [Date + Time]
   I'll walk you through the platform and answer questions.
   Zoom link: [link]

2. **Team Training:** [Date + Time]
   I'll train your procurement team (up to 5 users).
   Zoom link: [link]

3. **User Guide:** Attached is a PDF guide with step-by-step instructions.

4. **Support:** For questions, email support@agrichain360.com or WhatsApp +256 XXX XXXXXX.

**Quick Start:**
1. Login to https://agrichain360.com/login
2. Go to "Suppliers" → Search for maize in Mayuge
3. Click on a farmer → View quality passport
4. Click "Contact" → Send message to farmer

I'm excited to help you streamline your procurement!

Best regards,
[Your Name]
Founder, AGRICHAIN 360
```

---

## Success Metrics

**Week 1:**
- [ ] Customer logs in at least 3 times
- [ ] Customer searches for suppliers
- [ ] Customer views at least 5 quality passports

**Week 2:**
- [ ] Customer contacts at least 3 farmers
- [ ] Customer downloads at least 1 quality certificate
- [ ] Customer provides feedback (positive or constructive)

**Week 3:**
- [ ] Customer completes first procurement (even if small)
- [ ] Customer agrees to case study
- [ ] Customer confirms they will convert to paid plan

**Week 4:**
- [ ] Customer converts to paid Professional plan
- [ ] Invoice sent and payment received
- [ ] Customer provides testimonial

---

**End of Onboarding Script**
