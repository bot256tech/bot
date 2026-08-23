# AGRICHAIN 360

Agricultural post-harvest platform for Uganda — marketplace, Digital Quality
Passports, partner services and a local decision-support advisor. Busoga
region pilot (Mayuge, Bugiri, Iganga, Jinja, Kamuli).

## What it does

**Farmer → Produce → Quality → Digital Passport → Decision Support → Marketplace → Buyer → Verification**

- **Accounts & roles** — Farmer, Buyer, Partner (dryer / lab / transporter / warehouse), Admin. Phone + password authentication (bcrypt), JWT for the API, server-side sessions for the web app.
- **Produce registry** — farmers register harvested batches (crop, quantity, price).
- **Quality records** — moisture and aflatoxin readings, entered by the farmer or a registered testing partner.
- **Digital Quality Passport** — one verifiable passport per batch with a deterministic grade (A/B/C/REJECTED), public verification page at `/verify`, and clear provenance labels (farmer-entered, partner-entered, or demonstration data).
- **AGRICHAIN Decision Advisor** — a local, rules-based advisor that answers from stored platform data (no external AI service required). Example: *"Can I list this coffee for sale?"* returns a readiness decision based on the farmer's own batch records.
- **Marketplace** — buyers browse, search and filter listings, inspect quality information and passports, and place order requests. Farmers manage listings and respond to orders.
- **Pilot economics** — drying/testing fee schedule and 3% marketplace commission (see `/pricing`).

## Architecture

```
Internet → Nginx (reverse proxy) → Node.js/Express (PM2) → PostgreSQL 16
                                     ├── EJS server-rendered web app
                                     └── REST API /api/v1 (JWT)
```

PostgreSQL is the single source of truth. The process manager (PM2) restarts
the app after crashes and reboots.

## Run locally

```bash
npm install
cp .env.example .env          # set DATABASE_URL, JWT_SECRET, SESSION_SECRET
npm run migrate               # create schema
npm run seed                  # optional: clearly-labelled demo data
npm start                     # http://localhost:3000
```

Demo accounts (seeded, sample data): farmer `+256700111111`, buyer
`+256700222222`, partner `+256700333333` — password `Demo@2026`.
The admin account password is set by the operator at seed time; rotate it
before real use.

## API overview

See `GET /api/v1` for a live index. Key areas:

| Area | Endpoints |
|---|---|
| Auth | `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me` |
| Marketplace | `GET /api/v1/marketplace/products`, `GET /product/:id`, `POST /listing` (farmer), `POST /calculate-fees`, `POST /orders` (buyer), `GET /orders` (buyer) |
| Quality | `GET /api/v1/quality/verify/:batch_number`, `POST /issue` (partner), `PUT /update/:id` (partner) |
| Advisor | `POST /api/v1/ai/ask`, `GET /api/v1/ai/suggestions` |
| Health | `GET /health` (app + database status) |

## Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) — full VPS deployment, operations, backup/restore
- [docs/CONFERENCE_RUNBOOK.md](docs/CONFERENCE_RUNBOOK.md) — demo script, test checklist, troubleshooting
- [docs/PITCH_SCRIPT.md](docs/PITCH_SCRIPT.md) — pitch narrative
- `mobile/` — React Native client · `firmware/` — ESP32 solar-dryer firmware

## Security notes

Secrets live only in the server's `.env` (never in Git). Passwords are bcrypt
hashed; sessions are stored in PostgreSQL; API endpoints are validated,
rate-limited and role-protected; PostgreSQL and PM2 bind to localhost only,
with Nginx as the sole public entry point.

## License

UNLICENSED — proprietary.
