# Klausel

AI-powered tenant-rights toolkit for expats in Germany. Wedge feature: **Mietvertrag Review** — upload a German lease, get a bilingual EN/DE report flagging illegal/risky clauses with BGH judgment + BGB section citations, in 5 minutes for €19.

## Status

Pre-implementation. Design spec approved 2026-05-08.

## Documents

- [Design spec](docs/superpowers/specs/2026-05-08-klausel-design.md) — full product, architecture, pricing, distribution, and risk plan

## Stack (planned)

- Next.js 16 (App Router)
- Supabase (auth + DB + storage)
- Stripe (payments)
- Anthropic Claude Sonnet 4.6 + Opus 4.7
- Resend (email, `noreply@klausel.app`)
- PostHog (analytics, server-side)
- Vercel (hosting)

## Phased rollout

| Week | Ships |
|---|---|
| 1 | Mietvertrag Review (€19 one-shot wedge) |
| 2 | Kaution Recovery letter generator (Pro) |
| 3 | Anmeldung guide + Mietspiegel deep-dive (Pro) |
| 4 | Mietvertragskündigung + NKA spot-check (Pro) |

## License

All rights reserved. Private repository.
