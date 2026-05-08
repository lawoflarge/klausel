# Klausel Launch Checklist

Single canonical reference for everything that needs to happen before launching `klausel.app` to first paying customer. Generated from the design spec + Week-1 implementation plan + final code review (2026-05-08).

---

## Phase 1 — Manual setup (~2 hours, do in parallel)

These create accounts/credentials. None can be automated.

- [ ] **Register `klausel.app` domain** at Namecheap / Porkbun / Cloudflare Registrar
- [ ] **Supabase project** at [supabase.com](https://supabase.com)
  - Region: `eu-central-1` (Frankfurt) — DSGVO
  - Save database password
  - Apply migration: paste `supabase/migrations/0001_initial_schema.sql` into SQL Editor
  - Create private buckets: `lease-uploads` and `report-pdfs`
  - Copy Project URL, anon key, service_role key → `.env.local`
- [ ] **Stripe** (test mode first, then live)
  - Create 3 products: €19 Mietvertrag Review one-shot, €9.99/mo Pro, €69/yr Pro Annual
  - Copy 3 price IDs + publishable + secret keys → `.env.local`
- [ ] **Resend account** (SEPARATE from any other Klausel-adjacent product — do not reuse Cleero's reputation)
  - Add domain `klausel.app` → EU region
  - Configure SPF + DKIM + DMARC at registrar (Resend shows the records)
  - Wait for domain verification
  - Create Send-only API key → `.env.local`
- [ ] **PostHog EU project** at [eu.posthog.com](https://eu.posthog.com)
  - Project name: "Klausel" → API key → `.env.local`
- [ ] **Anthropic Console** at [console.anthropic.com](https://console.anthropic.com)
  - Create API key → `.env.local`
- [ ] **Vercel** at [vercel.com](https://vercel.com)
  - Import `lawoflarge/klausel`
  - Add all env vars from `.env.local` (Production + Preview + Development scope)

## Phase 2 — Local fill-in

- [ ] **Generate 3 token secrets** — run 3×:
  ```powershell
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  Set as `DELETE_TOKEN_SECRET`, `REPORT_TOKEN_SECRET`, `CRON_SECRET` in both `.env.local` and Vercel env
- [ ] **Replace Impressum placeholder** at `src/app/[locale]/impressum/page.tsx:9` (`[Gewerbe-Adresse aus deiner Anmeldung einsetzen]`) with your real Gewerbe address — TMG §5 fineable

## Phase 3 — Local end-to-end test

```powershell
# Terminal 1: Stripe webhook forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy displayed signing secret to .env.local as STRIPE_WEBHOOK_SECRET

# Terminal 2: Run the app
npm run dev
```

Verify:
- [ ] `/upload` accepts a PDF (use `fixtures/sample-lease-berlin.pdf`)
- [ ] Stripe Checkout with test card `4242 4242 4242 4242` completes
- [ ] Process page shows progress, redirects to `/report/[id]?t=...` after 60-90s
- [ ] Email arrives with PDF attachment
- [ ] `/account/delete` request → email confirmation link → wipes data

## Phase 4 — Compliance pre-launch

- [ ] **Anwalt T&Cs review** (~€300-500)
  - Search "Anwalt IT-Recht / Medienrecht Berlin"
  - 1-hour review of `/agb`, `/datenschutz`, `/impressum`, output disclaimers
  - Validates RDG positioning (information vs Rechtsdienstleistung)
- [ ] **Berufshaftpflichtversicherung** (~€200-500/yr)
  - Hiscox / Hannoversche / Allianz IT-Dienstleister
  - Get quote + bind before live launch

## Phase 5 — Production deploy

- [ ] **Custom domain** at Vercel — add `klausel.app`, configure DNS records at registrar
- [ ] **Stripe live mode** — recreate 3 products, update price IDs + keys in Vercel env
- [ ] **Production webhook endpoint** in Stripe live → `https://klausel.app/api/webhooks/stripe`, copy signing secret to Vercel env
- [ ] **Live test purchase** with a real card — verify full flow
- [ ] **Refund yourself** in Stripe dashboard

## Phase 6 — Launch (Day 1)

Per the spec's distribution plan:

- [ ] **LinkedIn launch post** (full copy in design spec, Section 4)
- [ ] **r/germany original post** — careful, non-spammy contribution
- [ ] **Twitter launch thread**
- [ ] **Reddit reply mining** in r/germany / r/berlin for "Mietvertrag" / "lease question" threads in last 7 days
- [ ] **Show HN submission**
- [ ] **ProductHunt** (Day +1)

---

## Decisions still open

### Pro upsell at Stripe Checkout

The spec describes an opt-in toggle for Pro €9.99/mo at checkout. The current code has NO Pro line item. Final reviewer flagged this.

**Recommended:** defer to Week 2 when Pro features actually exist (currently there'd be nothing to upsell). The opt-in toggle lands when the first Pro feature ships (Kaution Recovery in Week 2).

If you disagree and want it before launch, ping me — it's ~30 lines in `src/app/api/checkout/route.ts`.

---

## Post-launch nice-to-haves (from final code review)

Not blockers — fix as you go.

- Replace 29 `as any` Supabase casts: `npx supabase gen types typescript --project-id <PROJECT_ID> --schema public > src/lib/supabase/types.ts`
- Constant-time `CRON_SECRET` comparison (`src/app/api/cron/cleanup/route.ts`)
- Rate limiting on `/api/upload`, `/api/track`, `/api/checkout`, `/api/account/delete`
- Resend bounce handling — webhook from Resend → mark order, retry to Stripe receipt email
- Move upload-page hardcoded EN/DE strings into `messages/*.json`
- Add Sentry to Datenschutzerklärung subprocessor list
- Translate footer disclaimer (currently German-only on EN pages)
- Integration test for `processOrder` happy path
- Expand BGH knowledge base from 5 to ~30-50 judgments (`src/lib/kb/bgh-judgments.json`) with Anwalt input
- Address Sentry `disableLogger` deprecation warning in `next.config.ts`

---

## Resuming work in a new Claude Code session

A `project_klausel.md` auto-memory was saved, so future sessions auto-load the project context. Or paste this into your first message:

> Working on Klausel at `C:\Users\levin\klausel`. Repo: github.com/lawoflarge/klausel (private). Week-1 MVP build complete on `main` (2026-05-08). Read `README.md` + `LAUNCH_CHECKLIST.md` for current state and remaining steps. Design spec: `docs/superpowers/specs/2026-05-08-klausel-design.md`. Plan: `docs/superpowers/plans/2026-05-08-klausel-week-1.md`.

---

## Key file index

| File | Purpose |
|---|---|
| `README.md` | Quick start + stack + status |
| `LAUNCH_CHECKLIST.md` | This file |
| `docs/superpowers/specs/2026-05-08-klausel-design.md` | Full design spec |
| `docs/superpowers/plans/2026-05-08-klausel-week-1.md` | 39-task implementation plan (executed) |
| `.env.example` | All env var keys (fill into `.env.local`) |
| `supabase/migrations/0001_initial_schema.sql` | DB schema to apply via Supabase SQL Editor |
| `src/lib/ai/system-prompt.ts` | The AI moat — system prompt + embedded BGH/BGB/Mietspiegel KB |
| `src/lib/kb/*.json` | Knowledge base (expand BGH from 5 → 30-50 pre-launch) |
| `src/lib/auth/tokens.ts` | HMAC token helpers (report authorization + email-verified deletion) |
| `fixtures/sample-lease-berlin.pdf` | Test fixture for E2E |
