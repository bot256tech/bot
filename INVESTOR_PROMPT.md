# AGRICHAIN 360™ — Investor Document Generator Prompt

## PURPOSE
This prompt generates TWO deliverables:
1. A **12-page PDF** — Complete investment prospectus
2. A **15-slide PowerPoint** — Investor pitch deck

---

## COPY THIS ENTIRE PROMPT INTO ANY AI TOOL (ChatGPT, Claude, Gemini, Copilot)

---

```
You are a senior investment document consultant and agricultural business strategist. Generate TWO complete, professional documents for AGRICHAIN 360™ — a post-harvest agricultural technology platform based in Uganda targeting the AYuTe Africa Challenge 2026.

═══════════════════════════════════════════════════════
DOCUMENT 1: 12-PAGE INVESTMENT PDF
═══════════════════════════════════════════════════════

Title: "AGRICHAIN 360™ — Investment Prospectus 2026"
Subtitle: "Uganda's Complete Post-Harvest Agricultural Platform"
Format: Professional PDF, 12 pages, full color
Tone: Professional, data-driven, investor-ready
Design: Deep Green (#1B5E20), Gold (#D4AF37), Charcoal (#333), Cream (#FAFAF5)

───────────────────────────────────────────────────────
PAGE 1 — COVER PAGE
───────────────────────────────────────────────────────
- Company logo: 🌾 AGRICHAIN 360™
- Title: "Investment Prospectus 2026"
- Subtitle: "Transforming Post-Harvest Agriculture in East Africa"
- Tagline: "From Farm to Market — Verified Quality, Real-Time IoT, Digital Traceability"
- Location: Kampala, Uganda
- Contact: Batesa Ibrahim | +256 746022547 | batesaibra6@gmail.com
- Website: agrichain360.onrender.com
- AYuTe Africa Challenge Uganda 2026 Season 5 badge
- Background: Professional image of Ugandan farmers in a green maize field

───────────────────────────────────────────────────────
PAGE 2 — EXECUTIVE SUMMARY
───────────────────────────────────────────────────────
**The Problem:**
- Uganda loses 30-40% of grain harvest annually to poor post-harvest handling
- $4 billion lost annually across Sub-Saharan Africa to post-harvest losses
- 12 million+ smallholder farmers lack access to quality testing, proper drying, and market linkages
- Aflatoxin contamination makes produce unsellable in export markets
- No traceability system exists from farm to buyer

**The Solution — AGRICHAIN 360™:**
- Complete post-harvest platform connecting farmers, buyers, and service providers
- IoT-powered solar drying with real-time monitoring (ESP32 + MQTT)
- AI-powered crop disease detection and yield prediction
- Digital Quality Passport with QR verification and SHA-256 traceability
- B2B marketplace with escrow-secured payments
- Mobile Money integration (MTN MoMo + Airtel Money)
- USSD access (*284#) for feature phones — no smartphone required
- Village Agent Network for last-mile farmer registration

**Key Metrics (Current):**
| Metric | Value |
|--------|-------|
| Registered Farmers | 847 |
| Tons Dried | 42.8 |
| Revenue Traded | UGX 15.6M |
| Post-Harvest Loss Reduction | 38% |
| Districts Covered | 4 (Jinja, Iganga, Kamuli, Mayuge) |
| Crop Types | 6+ (Maize, Coffee, Cocoa, Groundnuts, Beans, Cassava) |

**Investment Ask:** UGX 500,000,000 (~$135,000 USD)
**Projected ROI:** 340% over 3 years
**Break-even:** Month 8

───────────────────────────────────────────────────────
PAGE 3 — THE PROBLEM IN DETAIL
───────────────────────────────────────────────────────
**Post-Harvest Loss Crisis:**

Image: Real photo of grain spoilage / poor drying conditions in rural Uganda

**Statistics:**
- 40% of maize lost between harvest and market in Uganda
- Aflatoxin contamination affects 60%+ of groundnuts and maize
- Smallholder farmers earn 40-60% less due to poor quality
- Export markets reject Ugandan produce without certification
- No cold chain or proper storage infrastructure in rural areas

**Who Suffers:**
1. **Farmers** — lose income, cannot access premium markets
2. **Buyers** — receive inconsistent quality, no traceability
3. **Consumers** — exposed to contaminated food
4. **Economy** — $4B annual loss across Africa

**Current Gaps:**
- No integrated platform connecting all stakeholders
- Existing solutions (EzyAgric) focus on inputs, not post-harvest
- No IoT monitoring for drying and storage
- No digital quality certification system
- No USSD access for offline farmers

───────────────────────────────────────────────────────
PAGE 4 — THE SOLUTION: PLATFORM ARCHITECTURE
───────────────────────────────────────────────────────
**System Architecture Diagram:**

```
┌─────────────────────────────────────────────────────────────┐
│                    AGRICHAIN 360™ PLATFORM                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ WEBSITE  │  │MOBILE APP│  │ USSD *284#│                  │
│  │ EJS+Web  │  │React Ntv │  │Feature Phn│                  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
│       │              │              │                         │
│       └──────────────┼──────────────┘                         │
│                      │                                        │
│             ┌────────▼────────┐                               │
│             │   REST API v1   │                               │
│             │  JWT + RBAC     │                               │
│             └────────┬────────┘                               │
│                      │                                        │
│    ┌─────────────────┼─────────────────┐                     │
│    │                 │                 │                      │
│ ┌──▼──┐      ┌──────▼─────┐    ┌─────▼─────┐               │
│ │PgSQL│      │ WebSocket  │    │   MQTT    │               │
│ │  DB │      │ Socket.IO  │    │  Gateway  │               │
│ └─────┘      └────────────┘    └───────────┘               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Technology Stack:**
| Layer | Technology |
|-------|-----------|
| Backend | Node.js 18+ / Express.js |
| Database | PostgreSQL 14+ (Render managed) |
| Frontend | EJS templates + vanilla JS |
| Mobile | React Native (planned) |
| USSD | Africa's Talking API |
| IoT | ESP32 + MQTT + Socket.IO |
| Payments | MTN MoMo + Airtel Money APIs |
| SMS | Africa's Talking SMS API |
| Hosting | Render.com (cloud-native) |
| AI | TensorFlow.js (client-side) |

**14 Stakeholder Types:**
Farmers • Village Agents • Cooperatives • Buyers • Exporters • Agro-Input Dealers • Transport Providers • Warehouses • Financial Institutions • Insurance Companies • Government Extension Officers • Researchers • NGOs • Agronomists

───────────────────────────────────────────────────────
PAGE 5 — CORE FEATURES (HOW IT WORKS)
───────────────────────────────────────────────────────
**4-Step Flow: Farm to Market**

**Step 1: Farmer Registration**
- Register via USSD (*284#) or web app
- GPS-mapped farm gardens with area calculation
- Village agents register offline farmers
- Automatic seed & fertilizer calculations

**Step 2: Quality Processing**
- IoT solar drying with ESP32 sensors
- Real-time temperature, humidity, moisture monitoring
- Automated aflatoxin risk alerts
- Target moisture: ≤13% for Grade A certification

**Step 3: Digital Quality Passport**
- SHA-256 blockchain-style traceability
- QR code for each batch
- Moisture, aflatoxin, quality grade recorded
- Tamper-proof, verifiable by any buyer

**Step 4: Trade & Payment**
- B2B marketplace with verified listings
- Escrow-secured transactions
- Bidding & negotiation system
- MTN MoMo / Airtel Money instant payouts

**Additional Features:**
- AI Crop Advisor — disease detection, yield prediction, market intelligence
- Village Agent Network — commission-based agents for last-mile reach
- Cooperative Management — member registration, savings, loans, bulk selling
- Digital Credit — automated credit scoring from farming history
- Logistics Platform — transport matching with live GPS tracking

───────────────────────────────────────────────────────
PAGE 6 — REVENUE MODEL (HOW THE APP EARNS)
───────────────────────────────────────────────────────

**12 Revenue Streams:**

| # | Revenue Stream | Who Pays | Monthly Potential |
|---|---------------|----------|-------------------|
| 1 | Enterprise Buyer Subscriptions | Exporters, processors | UGX 250K–2M/month per client |
| 2 | Quality Testing Fees | Farmers (per batch) | UGX 5,000–15,000 per test |
| 3 | Solar Drying Service Fees | Farmers (per kg) | UGX 200–500/kg |
| 4 | Marketplace Commissions | Buyers (premium features) | 2-5% per transaction |
| 5 | Digital Quality Passport Fees | Buyers (per certificate) | UGX 10,000–50,000 per cert |
| 6 | API Access Fees | Enterprise clients | UGX 500K–2M/month |
| 7 | White-Label Deployments | Cooperatives, NGOs | UGX 5–30M implementation + annual |
| 8 | Sponsored Campaigns | Agribusinesses (ads) | UGX 500K–5M per campaign |
| 9 | Input Marketplace Listings | Seed/fertilizer dealers | UGX 50K–200K/month per dealer |
| 10 | Transport Booking Fees | Transport providers | 5-10% per booking |
| 11 | Training & Certification | NGOs, cooperatives | UGX 2–10M per program |
| 12 | Data & Analytics | Researchers, government | UGX 1–5M per report |

**Subscription Tiers (Enterprise Buyers):**

| Plan | Monthly Price | Annual Price | Features |
|------|--------------|-------------|----------|
| FREE_TRIAL | UGX 0 | UGX 0 | 10 suppliers, basic search, 30 days |
| STARTER | UGX 250,000 | UGX 2,500,000 | 50 suppliers, contact farmers, basic reports |
| PROFESSIONAL | UGX 750,000 | UGX 7,500,000 | 500 suppliers, procurement tools, certificates, analytics |
| ENTERPRISE | UGX 2,000,000 | UGX 20,000,000 | Unlimited, API access, compliance, dedicated support |

**Revenue Projections (3 Years):**

| Year | Farmers | Buyers | Monthly Revenue | Annual Revenue |
|------|---------|--------|----------------|---------------|
| Year 1 | 2,000 | 20 | UGX 8M | UGX 96M |
| Year 2 | 10,000 | 80 | UGX 35M | UGX 420M |
| Year 3 | 50,000 | 200 | UGX 120M | UGX 1.44B |

───────────────────────────────────────────────────────
PAGE 7 — INVESTMENT BREAKDOWN (WHERE MONEY GOES)
───────────────────────────────────────────────────────

**Total Investment Required: UGX 500,000,000 (~$135,000 USD)**

| Category | Amount (UGX) | Amount (USD) | % of Total | What It Covers |
|----------|-------------|-------------|-----------|----------------|
| **Solar Drying Infrastructure** | 150,000,000 | $40,500 | 30% | 3 solar dryer units (Mayuge, Kamuli, Jinja), ESP32 sensors, installation |
| **Quality Testing Lab Equipment** | 80,000,000 | $21,600 | 16% | Moisture meters, aflatoxin test kits, lab setup, certification |
| **Technology Development** | 100,000,000 | $27,000 | 20% | Mobile app development, API integrations, USSD gateway, AI models |
| **Village Agent Network** | 50,000,000 | $13,500 | 10% | Recruit & train 100 agents, tablets, commissions (6 months) |
| **Marketing & Farmer Onboarding** | 40,000,000 | $10,800 | 8% | SMS campaigns, community events, radio ads, demo days |
| **Operations & Staffing** | 50,000,000 | $13,500 | 10% | 2 developers, 1 operations manager, 1 field coordinator (6 months) |
| **Working Capital & Contingency** | 30,000,000 | $8,100 | 6% | Cloud hosting, SMS credits, insurance, emergency fund |
| **TOTAL** | **500,000,000** | **$135,000** | **100%** | |

**Itemized Solar Drying Budget:**
| Item | Qty | Unit Cost (UGX) | Total (UGX) |
|------|-----|-----------------|-------------|
| Solar dryer structure (20ft container) | 3 | 25,000,000 | 75,000,000 |
| ESP32 sensor kits (temp, humidity, moisture) | 15 | 500,000 | 7,500,000 |
| Drying racks & trays | 30 | 800,000 | 24,000,000 |
| Solar panels & battery backup | 6 | 3,500,000 | 21,000,000 |
| Installation & wiring | 3 | 4,000,000 | 12,000,000 |
| MQTT server & IoT platform setup | 1 | 10,500,000 | 10,500,000 |
| **Subtotal** | | | **150,000,000** |

**Itemized Lab Equipment Budget:**
| Item | Qty | Unit Cost (UGX) | Total (UGX) |
|------|-----|-----------------|-------------|
| Digital moisture meters (Dickey-John) | 5 | 3,000,000 | 15,000,000 |
| Aflatoxin test kits (VICAM) | 200 | 50,000 | 10,000,000 |
| Aflatoxin rapid reader | 1 | 15,000,000 | 15,000,000 |
| Lab furniture & equipment | 1 | 10,000,000 | 10,000,000 |
| Purity & grading equipment | 1 | 8,000,000 | 8,000,000 |
| Lab certification & accreditation | 1 | 12,000,000 | 12,000,000 |
| Consumables (6 months) | 1 | 10,000,000 | 10,000,000 |
| **Subtotal** | | | **80,000,000** |

───────────────────────────────────────────────────────
PAGE 8 — FINANCIAL PROJECTIONS
───────────────────────────────────────────────────────

**Monthly Operating Costs (Steady State):**
| Item | Monthly Cost (UGX) |
|------|-------------------|
| Staff salaries (4 people) | 8,000,000 |
| Cloud hosting (Render + DB) | 500,000 |
| SMS credits (Africa's Talking) | 1,000,000 |
| USSD shortcode rental | 800,000 |
| Marketing & outreach | 2,000,000 |
| Equipment maintenance | 1,500,000 |
| Insurance & compliance | 500,000 |
| Transport & logistics | 1,000,000 |
| Miscellaneous | 700,000 |
| **Total Monthly Burn** | **16,000,000** |

**Revenue vs. Costs (Month by Month):**

| Month | Revenue (UGX) | Costs (UGX) | Net (UGX) | Cumulative (UGX) |
|-------|--------------|-------------|-----------|-------------------|
| 1 | 2,000,000 | 16,000,000 | -14,000,000 | -14,000,000 |
| 2 | 4,000,000 | 16,000,000 | -12,000,000 | -26,000,000 |
| 3 | 6,000,000 | 16,000,000 | -10,000,000 | -36,000,000 |
| 4 | 8,000,000 | 16,000,000 | -8,000,000 | -44,000,000 |
| 5 | 10,000,000 | 16,000,000 | -6,000,000 | -50,000,000 |
| 6 | 12,000,000 | 16,000,000 | -4,000,000 | -54,000,000 |
| 7 | 15,000,000 | 16,000,000 | -1,000,000 | -55,000,000 |
| **8** | **18,000,000** | **16,000,000** | **+2,000,000** | **-53,000,000** ← BREAK-EVEN |
| 9 | 22,000,000 | 16,000,000 | +6,000,000 | -47,000,000 |
| 10 | 28,000,000 | 16,000,000 | +12,000,000 | -35,000,000 |
| 11 | 35,000,000 | 16,000,000 | +19,000,000 | -16,000,000 |
| 12 | 42,000,000 | 16,000,000 | +26,000,000 | +10,000,000 ← PROFITABLE |

**Break-even: Month 8 | Full ROI: Month 18 | 3-Year ROI: 340%**

───────────────────────────────────────────────────────
PAGE 9 — COMPETITIVE ADVANTAGE
───────────────────────────────────────────────────────

**vs. EzyAgric (Uganda's largest agritech):**

| Feature | EzyAgric | AGRICHAIN 360™ |
|---------|----------|----------------|
| Focus | Input sales & farm management | Post-harvest quality & traceability |
| IoT Monitoring | ❌ None | ✅ Real-time solar dryer monitoring |
| Quality Testing | ❌ None | ✅ Moisture & aflatoxin lab testing |
| Digital Passport | ❌ None | ✅ QR-verified, SHA-256 traceability |
| USSD Access | ❌ App only | ✅ *284# for feature phones |
| AI Disease Detection | ❌ Basic tips | ✅ TensorFlow.js image analysis |
| B2B Marketplace | ❌ Farmer-facing only | ✅ Escrow-secured buyer marketplace |
| Mobile Money | ❌ Manual | ✅ MTN MoMo + Airtel Money API |
| Voice AI | ❌ None | ✅ English + Luganda voice synthesis |
| Village Agents | ✅ Yes | ✅ With GPS mapping & commission tracking |

**Our Moat:**
1. **IoT sensor network** across drying hubs — data advantage grows with every user
2. **Quality certification database** — becomes the industry standard
3. **Village agent network** — last-mile reach competitors can't easily replicate
4. **USSD + Web + App** — maximum market penetration (no farmer excluded)

───────────────────────────────────────────────────────
PAGE 10 — TEAM & MILESTONES
───────────────────────────────────────────────────────

**Founder:**
- **Batesa Ibrahim** — Full-stack developer, agricultural technology specialist
- Phone: +256 746022547 | Email: batesaibra6@gmail.com
- GitHub: github.com/bot256tech/bot
- Live demo: agrichain360.onrender.com

**Planned Team (Post-Investment):**
| Role | Hire Timeline | Monthly Salary (UGX) |
|------|--------------|---------------------|
| Lead Developer (Founder) | Immediate | 3,000,000 |
| Mobile App Developer | Month 2 | 2,500,000 |
| Operations Manager | Month 1 | 2,000,000 |
| Field Coordinator | Month 1 | 1,500,000 |
| Lab Technician | Month 3 | 1,500,000 |

**Milestones:**

| Timeline | Milestone |
|----------|-----------|
| Month 1-2 | Platform live, 100 village agents recruited, 500 farmers registered |
| Month 3-4 | First solar dryer operational (Mayuge), lab testing begins |
| Month 5-6 | 2,000 farmers, 10 enterprise buyers, first Mobile Money payouts |
| Month 7-8 | Break-even, second dryer (Kamuli), USSD *284# live |
| Month 9-12 | 5,000 farmers, 50 buyers, third dryer (Jinja), mobile app launch |
| Year 2 | 20,000 farmers, expansion to 8 districts, cooperative partnerships |
| Year 3 | 50,000 farmers, regional expansion (Kenya, Tanzania), Series A |

───────────────────────────────────────────────────────
PAGE 11 — SOCIAL IMPACT & SUSTAINABILITY
───────────────────────────────────────────────────────

**Social Impact Targets (3 Years):**

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Farmers reached | 5,000 | 20,000 | 50,000 |
| Women farmers (% of total) | 62% | 60% | 58% |
| Post-harvest loss reduction | 38% | 45% | 55% |
| Farmer income increase | 25% | 35% | 50% |
| Jobs created (direct) | 15 | 50 | 150 |
| Jobs created (indirect, agents) | 100 | 500 | 2,000 |
| Districts covered | 4 | 8 | 15 |

**UN Sustainable Development Goals Alignment:**
- SDG 1: No Poverty — increasing farmer incomes by 25-50%
- SDG 2: Zero Hunger — reducing 40% post-harvest food loss
- SDG 5: Gender Equality — 62% women farmers served
- SDG 8: Decent Work — creating 2,000+ indirect jobs via village agents
- SDG 9: Industry & Innovation — IoT, AI, blockchain-style traceability
- SDG 12: Responsible Consumption — quality certification reduces waste
- SDG 13: Climate Action — solar-powered drying (zero fossil fuels)

**Environmental Impact:**
- Solar-powered drying = zero carbon emissions
- Reduced food waste = lower methane from decomposing crops
- Digital traceability = less paper, less fraud
- Efficient transport routing = fewer empty truck trips

───────────────────────────────────────────────────────
PAGE 12 — INVESTMENT TERMS & CONTACT
───────────────────────────────────────────────────────

**Investment Ask: UGX 500,000,000 (~$135,000 USD)**

**Proposed Terms:**
- Equity: 15-20% stake (negotiable)
- Or: Convertible note with 20% discount, $2M cap
- Or: Revenue-sharing agreement (5% of revenue for 5 years)

**Use of Funds:**
- 30% — Solar drying infrastructure (3 hubs)
- 20% — Technology development (mobile app, APIs, AI)
- 16% — Lab equipment & certification
- 10% — Village agent network
- 8% — Marketing & farmer onboarding
- 10% — Operations & staffing
- 6% — Working capital & contingency

**Exit Strategy:**
- Year 5: Series A at $5-10M valuation
- Year 7: Acquisition by regional agritech player or IPO
- Strategic acquirers: EzyAgric, Twiga Foods, Apollo Agriculture, DigiFarm

**Contact:**
- **Batesa Ibrahim** — Founder & CEO
- Phone: +256 746022547
- Email: batesaibra6@gmail.com
- Website: agrichain360.onrender.com
- GitHub: github.com/bot256tech/bot
- Location: Kampala, Uganda

═══════════════════════════════════════════════════════
DOCUMENT 2: POWERPOINT PITCH DECK (15 SLIDES)
═══════════════════════════════════════════════════════

Title: "AGRICHAIN 360™ — Investor Pitch Deck"
Format: 15 slides, widescreen (16:9), professional
Design: Deep Green (#1B5E20), Gold (#D4AF37), Charcoal (#333), Cream (#FAFAF5)
Fonts: Space Grotesk (headings), Inter (body)

**SLIDE 1 — Title Slide**
- 🌾 AGRICHAIN 360™
- "Transforming Post-Harvest Agriculture in East Africa"
- AYuTe Africa Challenge Uganda 2026
- Batesa Ibrahim | agrichain360.onrender.com
- Background: Hero image of Ugandan farmers

**SLIDE 2 — The Problem**
- "40% of Uganda's grain harvest is LOST every year"
- $4 billion lost annually across Africa
- 3 bullet points: poor drying, no testing, no traceability
- Image: Post-harvest grain loss photo

**SLIDE 3 — The Solution**
- "One platform. Farm to market."
- 4 icons: Registration → Drying → Passport → Trade
- Key differentiator: IoT + AI + USSD + Mobile Money

**SLIDE 4 — How It Works (Visual Flow)**
- Step 1: Farmer registers (USSD/Web)
- Step 2: Solar drying with IoT monitoring
- Step 3: Quality tested, Digital Passport issued
- Step 4: Buyer purchases, farmer paid via Mobile Money

**SLIDE 5 — Platform Features**
- 6 feature cards with icons:
  - AI Crop Advisor
  - IoT Smart Dryers
  - Digital Quality Passport
  - B2B Marketplace
  - Mobile Money Payments
  - Village Agent Network

**SLIDE 6 — Technology Stack**
- Architecture diagram (simplified)
- Key technologies: Node.js, PostgreSQL, MQTT, TensorFlow.js
- Cloud-native, scalable to 100K+ farmers

**SLIDE 7 — Market Opportunity**
- TAM: $4B post-harvest loss market
- SAM: 12M smallholder farmers in East Africa
- SOM: 50,000 farmers in Uganda (Year 3 target)
- Growing export demand for certified produce

**SLIDE 8 — Revenue Model**
- 12 revenue streams (simplified to top 6)
- Subscription tiers: Starter → Professional → Enterprise
- Key metric: UGX 2M/month per enterprise client

**SLIDE 9 — Financial Projections**
- Bar chart: Revenue vs. Costs (12 months)
- Break-even: Month 8
- Year 3 revenue: UGX 1.44B
- ROI: 340% over 3 years

**SLIDE 10 — Investment Ask**
- UGX 500M (~$135K USD)
- Pie chart: Where money goes (30% infrastructure, 20% tech, 16% lab, etc.)
- Use of funds breakdown

**SLIDE 11 — Competitive Advantage**
- Comparison table: AGRICHAIN 360 vs. EzyAgric
- Key differentiators: IoT, Quality Passport, USSD, AI

**SLIDE 12 — Traction & Milestones**
- Current: 847 farmers, 42.8T dried, UGX 15.6M traded
- Timeline: Month 1-12 milestones
- Live demo: agrichain360.onrender.com

**SLIDE 13 — Social Impact**
- UN SDG alignment (7 goals)
- Key metrics: 62% women, 38% loss reduction, 2,000+ jobs
- Environmental: solar-powered, zero emissions

**SLIDE 14 — Team**
- Batesa Ibrahim — Founder & CEO
- Planned team: 5 people post-investment
- Advisory board (planned)

**SLIDE 15 — Call to Action**
- "Join us in transforming African agriculture"
- Investment ask: UGX 500M
- Contact: Batesa Ibrahim | +256 746022547 | batesaibra6@gmail.com
- agrichain360.onrender.com

═══════════════════════════════════════════════════════
IMAGES TO INCLUDE
═══════════════════════════════════════════════════════

Use real, professional photographs (NOT AI-generated):
1. Ugandan farmers harvesting maize in a green field (hero image)
2. Solar dryer facility with metal panels and drying trays
3. Quality testing laboratory with moisture meters
4. B2B grain marketplace with bags of produce
5. Farmer receiving Mobile Money payment on phone
6. Village agent registering farmers with tablet
7. Post-harvest grain loss / spoilage (problem image)
8. IoT sensors and ESP32 microcontroller on dryer
9. QR code scanning on quality certificate
10. Aerial view of agricultural landscape in Uganda

═══════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════

Please generate:
1. The complete 12-page PDF content (page by page, with all text, tables, and image placement instructions)
2. The complete 15-slide PowerPoint content (slide by slide, with all text, layout descriptions, and image placement)
3. A summary table of all financial figures for quick reference

Make each page/slide self-contained and professional. Use data tables, bullet points, and visual hierarchy. Include specific UGX amounts and USD equivalents throughout.
```

---

## HOW TO USE THIS PROMPT

1. Copy the entire prompt above (between the ``` markers)
2. Paste it into ChatGPT (GPT-4), Claude, or Gemini
3. Ask it to generate the PDF content first
4. Then ask it to generate the PowerPoint content
5. Use the output to create the actual documents in:
   - **PDF:** Canva, Google Docs, or Microsoft Word → Export as PDF
   - **PPT:** Google Slides, Canva, or Microsoft PowerPoint

## QUICK REFERENCE: KEY FINANCIAL FIGURES

| Metric | Value |
|--------|-------|
| Total Investment Ask | UGX 500,000,000 (~$135,000 USD) |
| Monthly Operating Cost | UGX 16,000,000 |
| Break-even Month | Month 8 |
| Year 1 Revenue | UGX 96,000,000 |
| Year 2 Revenue | UGX 420,000,000 |
| Year 3 Revenue | UGX 1,440,000,000 |
| 3-Year ROI | 340% |
| Equity Offered | 15-20% |
| Solar Dryer Cost (per unit) | UGX 50,000,000 |
| Lab Setup Cost | UGX 80,000,000 |
| Enterprise Plan (top tier) | UGX 2,000,000/month |
| Drying Fee (maize) | UGX 200/kg |
| Quality Test Fee | UGX 5,000-15,000/batch |
