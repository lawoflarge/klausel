# Klausel

AI-powered tenant-rights toolkit for expats in Germany. Wedge feature: **Mietvertrag Review** — upload a German lease, get a bilingual EN/DE report flagging illegal/risky clauses with BGH judgment + BGB section citations, in 5 minutes for €19.

## Status

**Week-1 MVP build complete (2026-05-08).** 26 implementation commits + 5 security fixes from final code review, merged to `main`. Ready for manual setup → local end-to-end test → production deploy.

All gates green: typecheck ✓ build (10 routes) ✓ tests (17 passed, 1 AI-integration skipped behind `VITEST_RUN_AI`) ✓.

## Quick start (no credentials needed)

```powershell
git clone https://github.com/lawoflarge/klausel.git
cd klausel
npm install
npm run dev
```

Open `http://localhost:3000` (English) or `http://localhost:3000/de` (German).

**The killer demo runs without any credentials:** open `http://localhost:3000/sample` (or `/de/sample`) to see a hand-crafted bilingual sample report with 4 flagged clauses + Mietpreisbremse delta — exactly what a real customer will receive.

## What works locally without credentials

- ✅ `/` and `/de` — landing page with hero, CTAs, language toggle
- ✅ `/sample` and `/de/sample` — bilingual sample report (the conversion-driving demo)
- ✅ `/impressum`, `/datenschutz`, `/agb` — legal pages
- ✅ `/upload` — form renders (submission needs Supabase + Stripe)

## What needs credentials for the full flow

- Upload form submission → Supabase storage + DB
- Stripe Checkout → Stripe (test or live keys)
- AI lease analysis → Anthropic API key
- Email delivery → Resend with `klausel.app` domain DNS verified
- Report viewing + PDF download → Supabase
- Analytics → PostHog (graceful no-op if absent)
- Error monitoring → Sentry (graceful no-op if absent)

## Stack

Next.js 16 App Router · TypeScript · Tailwind + shadcn/ui · `next-intl` for EN/DE bilingual routing via `proxy.ts` · Supabase (DB + storage, RLS deny-by-default) · Stripe (Checkout + webhook with HMAC signature verification) · Anthropic Claude Sonnet 4.6 (Opus 4.7 fallback) with prompt-cached BGH/BGB knowledge base · `@react-pdf/renderer` for bilingual A4 reports · Resend · PostHog (server-side, EU) · Sentry · Vercel.

## Phased rollout

| Week | Status | Ships |
|---|---|---|
| **1** | ✅ Complete | Mietvertrag Review €19 one-shot — landing, upload, Stripe Checkout, AI with BGH/BGB citations, bilingual PDF + email, DSGVO delete + cron cleanup |
| 2 | ⏳ Planned | Kaution Recovery letter generator (Pro) |
| 3 | ⏳ Planned | Anmeldung guide + Mietspiegel deep-dive (Pro) |
| 4 | ⏳ Planned | Mietvertragskündigung + NKA spot-check (Pro) |

## Setup (manual prerequisites for full deployment)

1. **Domain** — register `klausel.app`
2. **Supabase project** (region `eu-central-1`) — apply `supabase/migrations/0001_initial_schema.sql` via SQL Editor; create private buckets `lease-uploads` and `report-pdfs`
3. **Stripe products** — create €19 one-shot, €9.99/mo Pro, €69/yr Pro Annual; copy 3 price IDs + publishable + secret keys
4. **Resend account** (separate from any other Klausel-adjacent product) — add `klausel.app` domain, configure SPF/DKIM/DMARC records at registrar
5. **PostHog EU project** — copy project API key
6. **Anthropic Console** — create API key
7. **Vercel** — import `lawoflarge/klausel`, link project, paste env vars
8. **Generate token secrets** — run 3×:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   for `DELETE_TOKEN_SECRET`, `REPORT_TOKEN_SECRET`, `CRON_SECRET`
9. **Replace Impressum placeholder** at `src/app/[locale]/impressum/page.tsx:9` with your Gewerbe address (TMG §5 fineable)
10. **Pre-launch compliance** — Anwalt T&Cs review (€300-500) + Berufshaftpflichtversicherung quote

Copy `.env.example` to `.env.local` and fill in all values.

## Local end-to-end test (after credentials are in `.env.local`)

```powershell
# Terminal 1: forward Stripe webhooks to local dev server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# (Copy the displayed signing secret into .env.local as STRIPE_WEBHOOK_SECRET)

# Terminal 2: run the app
npm run dev
```

Then visit `http://localhost:3000/upload`, upload a German lease PDF, complete checkout with test card `4242 4242 4242 4242`, wait 60-90s for processing → report renders with token-gated URL.

## Documents

- [Design spec](docs/superpowers/specs/2026-05-08-klausel-design.md) — full product, architecture, pricing, distribution, and risk plan
- [Week 1 implementation plan](docs/superpowers/plans/2026-05-08-klausel-week-1.md) — 39-task build plan executed via subagent-driven development

## Known caveats (address before launch)

- **29 `as any` casts** on Supabase calls due to hand-written type stub — fix by running `npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> --schema public > src/lib/supabase/types.ts` once the Supabase project exists, then remove casts
- **BGH knowledge base** seeded with 5 judgments — expand to ~30-50 with Anwalt input pre-launch (see `src/lib/kb/bgh-judgments.json`)
- **AGB + Datenschutzerklärung** are templates — get anwaltlich geprüft before launch
- **Sentry `disableLogger` deprecation warning** at build (non-fatal; current SDK changed the API)

## License

All rights reserved. Private repository.
