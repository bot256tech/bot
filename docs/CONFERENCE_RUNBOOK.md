# AGRICHAIN 360 — Conference Runbook

Live system: `https://16.192.159.6` (self-signed certificate — accept the browser
warning once; plain `http://` becomes available when TCP port 80 is also opened
at the cloud edge) · Health: `https://16.192.159.6/health`
API index: `https://16.192.159.6/api/v1`

## Demo accounts (seeded demonstration data)

| Role | Phone | Password |
|---|---|---|
| Farmer (John Mukasa, Mayuge) | `+256700111111` | `Demo@2026` |
| Buyer (Busia Grains Ltd) | `+256700222222` | `Demo@2026` |
| Partner (Busoga Quality Lab) | `+256700333333` | `Demo@2026` |
| Admin | `+256700000000` | (set at seed time — see operator notes) |

All seeded listings/passports are labelled **Demonstration record** — the UI
says so explicitly. Nothing fabricated is presented as a verified laboratory
result.

## 8-minute demo script

1. **Landing page** (30s) — positioning: post-harvest losses → quality
   infrastructure → premium markets. Busoga pilot numbers.
2. **Marketplace** (1 min) — `/marketplace`. Real listings in PostgreSQL:
   crop, quantity, price, quality status, grade, moisture. Search "coffee",
   filter by district. Click a passport batch number.
3. **Quality Passport** (1.5 min) — the public verification page: batch
   number, farmer, crop, quantity, moisture, aflatoxin, grade, provenance
   label ("Demonstration record"), grading standard. Emphasize: any buyer can
   verify any batch in seconds — this is the trust layer.
4. **Farmer journey** (2 min) — log in as the farmer.
   - Dashboard shows real numbers: listings, passports, order requests,
     earnings; AI recommendation for the latest batch.
   - Register produce (e.g. 300 kg Maize @ UGX 1,800).
   - Record quality information (moisture 12.4%, aflatoxin 3.0) → system
     assigns Grade A, issues/updates the passport, listing becomes Approved.
   - Ask the Decision Advisor: "Can I list this maize for sale?" → it quotes
     the stored moisture/grade and confirms readiness. (Fully local rules
     engine — works with zero external AI services.)
5. **Buyer journey** (1.5 min) — log in as the buyer.
   - Dashboard: available produce with quality info.
   - Open the new maize listing → passport attached → place an order request
     (quantity 100 kg) → order appears in Order History with status Pending.
6. **Admin** (1 min) — log in as admin: users by role, farmer verification
   queue (verify one), passports by grade, orders and platform value.
7. **Persistence & resilience** (30s) — `pm2 restart agrichain360` (or
   reboot): every record survives; `/health` shows database connected.

## Pre-demo verification checklist

```bash
curl -s http://16.192.159.6/health                 # database: connected
curl -s http://16.192.159.6/api/v1/marketplace/stats
```

Web walk-through: marketplace renders listings → `/verify` resolves a demo
batch → farmer login → produce + quality forms work → buyer login → order
places → admin login → dashboard counts non-zero.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `/health` shows database disconnected | `sudo systemctl status postgresql`; check `.env` `DATABASE_URL`; `pm2 restart agrichain360` |
| 502 from Nginx | `pm2 status` — restart app; check `pm2 logs agrichain360` |
| Login fails for demo accounts | re-run `npm run seed` in `/opt/agrichain360` (idempotent) |
| Marketplace empty | `npm run seed` seeds clearly-labelled demo listings |
| Rate limited during testing | wait 15 min or restart app (in-memory limiter) |

Ops commands live in [DEPLOYMENT.md](../DEPLOYMENT.md).

## Post-conference credential rotation

1. Rotate the server SSH key pair / remove temporary authorized keys.
2. Revoke any temporary GitHub tokens used for deployment.
3. Change the admin account password (and demo passwords) or delete demo
   accounts (`npm run seed` data).
4. Rotate `JWT_SECRET` and `SESSION_SECRET` in `.env` (logs all users out).
5. Set `SHOW_DEMO_CREDENTIALS=false` in `.env` and restart.
6. Enable `HTTPS_REDIRECT=true` once the domain + TLS certificate are active.
