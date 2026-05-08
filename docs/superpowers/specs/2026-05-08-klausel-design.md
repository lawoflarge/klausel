# Klausel — Design Spec

**Date:** 2026-05-08
**Author:** Levin Schwab
**Status:** Approved for implementation planning

## Summary

Klausel is an AI-powered tenant-rights toolkit for expats in Germany. The wedge feature is **Mietvertrag Review**: an expat uploads a German lease, gets a bilingual EN/DE report flagging illegal/risky clauses with BGH judgment + BGB section citations, in 5 minutes for €19. The product expands over the following 3 weeks into a full lifecycle toolkit (Kaution Recovery, Anmeldung, Mietspiegel deep-dive, Kündigung, NKA spot-check) gated behind a Pro subscription (€9.99/mo or €69/yr) that pays back in 2 months.

**Goal:** First paying customer in week 1. Phased rollout to full lifecycle by end of week 4.

## Problem

A native German renter signs a 30-page Mietvertrag and instinctively knows which clauses are dodgy because of cultural exposure (Schönheitsreparaturen-Klauseln void since BGH 2008, Mietpreisbremse limits, Staffelmiete edge cases). An expat does not. They sign, lose €1000s in deposits, illegal renovation clauses, or above-Mietpreisbremse rent, and have no recourse.

Existing solutions:

- **CONNY / wenigermiete / MieterEngel / Allright** — lawyer-led Inkasso, take 20-35% of recovered rent, slow (weeks/months), only act post-incident on disputes
- **Mineko / NebenkostenPro / Nebenkostencheck.io** — saturated Nebenkosten audit space
- **Mietspiegel calculators (10+ free)** — fully commoditized, no tooling around lease review itself
- **Settle in Berlin / IamExpat / Just Landed** — content blogs and forums, not transactional tools
- **Mieterverein** — annual €60-100/yr membership, manual lawyer review, slow, German-only

**The white space:** there is no productized AI-powered lease review tool for expats, despite this being the sharpest universal pain point (every expat hits it at move-in, time-pressured, language-barriered).

## Audience & positioning

**Primary audience:** expats in Germany — typically tech/finance professionals, international students, EU mobility workers — signing a German Mietvertrag for the first time with 24-72 hours to decide.

**Positioning:** "Renting in Germany made simple — for people who don't read 30 pages of legal German." EN-default UI with DE toggle. Tone is helpful, founder-personal, ex-quant credibility ("built by ex-Optiver quants in Amsterdam").

**Why this audience:** ~3-5M expats in Germany; ~500K-1M arrivals/turnover annually; high willingness to pay for legal/bureaucratic clarity; no dominant tool incumbent serves them.

**Why NOT broader DE-native market:** the German legaltech space (CONNY et al.) is saturated. Expats are an unguarded flank because incumbents are German-language-first.

## Product surface (v1 wedge)

### Brand

**Klausel** — German for "contract clause." Direct semantic anchor to the wedge feature; expandable to other tools (Kaution Recovery is a Klausel-claim, Kündigung is Klausel-driven). Pre-launch: confirm domain availability for `klausel.app` (preferred), then `klausel.eu`, `klausel.io` as fallbacks.

### Landing page hero

> # Don't sign that German Mietvertrag yet.
> Upload your lease. Get a bilingual review with every risky clause flagged — Mietpreisbremse compliance checked, illegal Schönheitsreparaturen-Klauseln spotted, BGH case-law referenced. **5 minutes. €19. No subscription needed.**
>
> [Upload Mietvertrag] [See sample report]
>
> *Built by ex-Optiver quants. Not a law firm — for binding advice, consult a Rechtsanwalt or Mieterverein.*

### Core user flow

```
1. LAND — hero + sample-report preview + EN/DE toggle + upload CTA
2. UPLOAD — drag-drop PDF (DE or EN-translated) OR paste text
   + 3-question form: Bundesland, base rent (€/mo), lease start date
3. CHECKOUT — Stripe Checkout, €19, email-only (no account required)
   + Opt-in (NOT pre-checked) Pro toggle: "+ Pro €9.99/mo, first month €4.99"
4. PROCESS — 30-90s AI run with progress UI:
   "Reading lease..." → "Translating clauses..." → "Cross-checking BGB..."
     → "Flagging risks..." → "Generating report..."
5. REPORT — web page + emailed PDF:
   • RISK SCORE: Green / Yellow / Red with one-line summary
   • SECTION-BY-SECTION: original DE clause + EN translation + plain-language gloss
   • FLAGGED CLAUSES: severity + reason + BGH judgment / BGB § + your right
   • MIETPREISBREMSE CHECK: rent vs. ortsübliche Vergleichsmiete delta
   • NEGOTIATION SCRIPT: 5 specific clauses to push back on + scripted email
   • NEXT STEPS: 5 actionable items
6. POST-SALE — 24h email: "Save 50% on first month of Pro" upsell
```

### Critical UX details

- EN-default with DE language toggle in header
- Sample report viewable without auth or signup
- No account required for one-shot purchase (account only on Pro upgrade)
- Pro upsell at checkout is **opt-in** (off by default), not pre-checked — prioritizes trust + low refund rate over aggressive ARR capture
- Mobile-first: ≥60% of expat traffic from mobile

### Legal positioning copy (mandatory)

- "Klausel ist keine Rechtsanwaltskanzlei. Wir bieten KI-gestützte Mietvertragsanalyse und Mieterbildung. Für verbindliche Rechtsberatung wenden Sie sich an einen Rechtsanwalt oder Mieterverein."
- Each flagged clause cites its source: BGH judgment number, BGB section
- Footer disclaimer per RDG compliance — information + education, not Rechtsdienstleistung

## Architecture

### Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 (App Router) | Reuse Cleero patterns: i18n routing, proxy.ts auth gate, components |
| Hosting | Vercel | Auto-deploy, edge runtime where useful |
| DB + Auth + Storage | Supabase | Deny-by-default RLS posture (matches Cleero), magic-link auth for Pro |
| Payments | Stripe | Stripe Checkout for one-shot; Stripe Customer Portal for Pro |
| Email | Resend | New `noreply@klausel.app` sender — do NOT reuse Cleero's, separate domain reputation |
| AI primary | Claude Sonnet 4.6 | Cost/latency sweet spot; prompt caching mandatory |
| AI fallback | Claude Opus 4.7 (1M context) | Re-run on Red-flag cases or 30+ page leases for higher confidence |
| PDF input | Anthropic Files API (native PDF) + Tesseract.js fallback for scans | Native PDF reading saves a parsing layer |
| PDF output | `@react-pdf/renderer` | Bilingual side-by-side layout |
| i18n | `next-intl` | EN + DE locales, route-based |
| Analytics | PostHog | Server-side configuration to skip cookie banner; funnel: land → upload → checkout → report |

### AI architecture

Three-layer prompt structure:

```
Layer 1: SYSTEM PROMPT (cached, ~30-50K tokens, 5-min TTL)
  • ~30-50 curated BGH judgments on Schönheitsreparaturen +
    rental clauses (case number + invalidating-clause rules)
  • BGB §§ 535-578a relevant excerpts
  • Mietpreisbremse rules per Bundesland (2026 status)
  • Red-flag clause library (Indexmiete edge cases, Staffelmiete
    caps, Untervermietung restrictions, Tierhaltung blanket bans,
    Eigenbedarfs-clauses)
  • Output schema (JSON, strict)

Layer 2: USER INPUT
  • Lease PDF (Anthropic Files API, native PDF)
  • Bundesland, base rent, lease start date

Layer 3: RUNTIME ROUTING
  • First pass: Sonnet 4.6 with structured JSON output
  • Escalation: if RED flag count ≥ 3 OR rent > ortsübliche by 20%+,
    re-run flagged clauses through Opus 4.7
  • Validate output against JSON schema; reject + retry on schema fail
```

### Knowledge base (the moat)

Sourced from public legal databases:

- **BGH judgments**: dejure.org, openjur.de — curate ~30-50 key rulings on Schönheitsreparaturen, rental clauses, Mietpreisbremse interpretation
- **BGB excerpts**: gesetze-im-internet.de (public domain)
- **Mietspiegel data per city** (Berlin, München, Hamburg, Frankfurt, Köln first — Mietpreisbremse cities) from each city's published Mietspiegel
- **Red-flag library**: built from Mieterverein materials + Stiftung Warentest articles + Anwalt blog posts

Stored: inline in cached system prompt for v1 (fits in ~30-50K tokens). Migrate to Supabase + RAG retrieval if knowledge base outgrows context window.

### Output schema (strict JSON)

```json
{
  "risk_score": "GREEN | YELLOW | RED",
  "summary_en": "1-sentence verdict",
  "summary_de": "1-sentence verdict",
  "flagged_clauses": [
    {
      "clause_text_de": "original German",
      "clause_text_en": "translation",
      "severity": "INFO | WARN | CRITICAL",
      "reason_en": "why this is risky",
      "reason_de": "warum problematisch",
      "legal_basis": "BGH VIII ZR 47/04 | BGB §535 | etc.",
      "confidence": 0.0,
      "recommended_action": "negotiate removal | accept | walk away",
      "negotiation_script_en": "what to say to landlord",
      "negotiation_script_de": "was du dem Vermieter sagst"
    }
  ],
  "mietpreisbremse": {
    "applies": true,
    "ortsübliche_vergleichsmiete_estimate": 1450,
    "your_rent": 1850,
    "delta_percent": 27.6,
    "may_be_entitled_to_reduction": true
  },
  "next_steps": ["string"],
  "metadata": {
    "clauses_analyzed": 47,
    "model_used": "sonnet-4.6",
    "report_id": "uuid"
  }
}
```

### Data flow

```
User upload → Supabase Storage (signed URL, 30-day expiry)
   ↓
Stripe Checkout completed → webhook → /api/webhooks/stripe
   ↓
Job queued (inline call for v1, no separate worker)
   ↓
Claude Files API: upload PDF → call Sonnet 4.6 with cached system prompt
   ↓
Validate JSON → save to Supabase DB → render web report
   ↓
Generate PDF via @react-pdf/renderer → upload to Storage
   ↓
Resend email with PDF attached + dashboard link
```

### Latency budget

- PDF upload: 2-5s
- Claude inference (Sonnet 4.6, 5-15 page lease): 30-60s
- PDF generation: 2-3s
- **Total: ~60-90s** with progress UI states. Acceptable for paid product.

### Privacy + retention

- Lease PDFs stored 30 days then auto-deleted (Vercel Cron)
- GDPR data-deletion endpoint at `/account/delete`
- RLS deny-by-default on all tables
- Server-side PostHog configuration → no browser cookies → no cookie consent banner needed

## Pricing & upsell

### Tiers

| Tier | Price | Includes | Excludes |
|---|---|---|---|
| **Free** | €0 | Mietspiegel quick-check (single ZIP), EN+DE rental glossary, Anmeldung walkthrough, sample report preview, 5 educational articles | No AI lease review, no dispute letters, no Kaution recovery |
| **One-shot Mietvertrag Review** | €19 | One full AI lease analysis, bilingual report, emailed PDF | No future tools, no second review |
| **Pro** | **€9.99/mo** or **€69/yr** (42% saving) | Unlimited Mietvertrag Reviews, Kaution Recovery letter, Mietvertragskündigung generator, Mietspiegel deep-dive, Mieterhöhung-Widerspruch, NKA spot-check, dashboard with saved reports, 24h priority email support | Not a substitute for Rechtsanwalt — escalations referred out |

Pro pays back in 2 months vs. paying for separate one-shots — clean math for upsell copy.

### Upsell touchpoints (3 chances to sell Pro)

| # | When | Default state | Copy |
|---|---|---|---|
| 1 | Stripe Checkout (pre-purchase) | **Opt-in (off by default)** | "+ Add Pro for €9.99/mo — unlock Kaution Recovery, Kündigung tools, unlimited reviews. First month half-off (€4.99). Cancel anytime." |
| 2 | Inside the report (post-AI) | Prominent, dismissible | After Red/Yellow flags: "Need to push back on this clause? Pro unlocks the customized dispute letter — €9.99/mo, first month €4.99." |
| 3 | 24h post-purchase email | Automated sequence | "How was your Klausel report? Pro pays for itself in 2 reviews. 50% off first month with code WELCOME50." |

Rationale for opt-in (not pre-checked): EU customers are sensitive to surprise subscriptions; pre-checked subs trigger chargebacks and Trustpilot bombs. Two backup touchpoints recover most of the lost ARR conversion.

### Pro feature roadmap (4-week phased launch)

| Week | Status | Pro adds | Pro becomes worth €9.99/mo when... |
|---|---|---|---|
| 1 | Soft launch | Unlimited Lease Reviews + priority support + roadmap promise | ...you commit annually |
| 2 | + Kaution Recovery | Dispute-letter generator with BGH case-law refs | ...you're disputing a deposit deduction |
| 3 | + Anmeldung deep-guide + Mietspiegel report | City-by-city Mietspiegel + Anmeldung video walkthrough | ...you're a fresh expat |
| 4 | + Mietvertragskündigung + NKA spot-check | Termination letter generator, NKA red-flag scanner | ...you're moving out or got an NKA |

Week-1 Pro positioning: "annual €69/yr unlocks the next 5 tools shipping over the next 30 days. Be the first when Kaution Recovery lands." Frames Pro as a roadmap purchase, not a single-use gate.

### Subscription mechanics

- Stripe Customer Portal for self-serve cancel/upgrade
- 1-click cancel button (Kündigungsbutton) per German law
- 7-day money-back, no questions
- Annual auto-renews 30 days before; reminder email 14 days before
- Pause feature (skip 1 month for €0) — implement week 4

### Refund policy

- One-shot: full refund within 7 days if PDF not downloaded; manual review if downloaded
- Pro monthly: cancel anytime + 7-day full-refund window on first charge
- Pro annual: 14-day full refund + prorated thereafter

## Distribution / launch plan

### Channels (priority order for week 1)

| Channel | Effort | Realistic outcome |
|---|---|---|
| LinkedIn (Levin's network) | 30 min post + 10 DMs | 200-500 reach, 1-2 buyers |
| r/germany original launch post | 1 hr | 50-200 visits, 1-3 buyers |
| r/germany / r/berlin reply mining | 30 min/day | 10-30 visits, 0-1 buyer/day |
| Twitter launch thread | 30 min | 50-150 visits |
| Show HN | 30 min submission | If picked: 1-3K visits, 5-10 buyers |
| Product Hunt | 4 hrs prep | 500-2000 visits, 5-15 buyers |
| Email to first 50 personal contacts | 1 hr | 1-3 buyers |
| Facebook expat groups (with mod permission) | 1 hr | 50-200 visits |

### Day-by-day playbook (assuming Mon = D1 build start)

| Day | Build | Marketing |
|---|---|---|
| D1 Mon | Scaffold Next.js, Supabase, Stripe; register `klausel.app` | Domain registered, brand confirmed |
| D2 Tue | Build upload + Stripe + Claude integration end-to-end | Pre-launch tweet teaser, soft LinkedIn post |
| D3 Wed | Build report rendering + PDF generation + email | Knowledge base curation (BGH judgments, Mietspiegel data) |
| D4 Thu | Polish landing page, sample report, EN/DE i18n | Landing live; 5 friends test the flow |
| D5 Fri | Bug-fix from friends' tests, monitoring/analytics | LinkedIn launch post + r/germany original post + Twitter thread |
| D6 Sat | Iterate on first user feedback | Reddit reply-mining for active "is this lease normal?" threads |
| D7 Sun | Polish, monitor errors | Show HN submission + ProductHunt prep |

### LinkedIn launch post (Levin's voice)

> Just launched something I built for expats in Germany.
>
> When I helped a friend negotiate her Berlin lease last month, I noticed her Mietvertrag had three illegal Schönheitsreparaturen-Klauseln (BGH ruled them void in 2008, 2013, 2016 — landlords still slip them in) and a Staffelmiete that exceeded Mietpreisbremse by 27%.
>
> Native Germans catch this. Expats sign and lose €1,000s.
>
> So I built **Klausel** (klausel.app) — upload your German Mietvertrag, AI flags every illegal/risky clause with the BGH judgment behind it, gives you a bilingual negotiation script for your landlord. €19, 5 minutes.
>
> Built on Claude + a curated knowledge base of ~50 BGH rulings on rental clauses. Not legal advice — for that go to a Mieterverein or Anwalt — but a sanity check before you sign.
>
> First 50 reports free with code BERLIN50. Would love feedback from anyone who's signed a German lease recently.

### Content (Week-1 SEO foundation)

5 cornerstone articles (~1500 words each, EN + DE versions):

1. "Illegal Schönheitsreparaturen-Klauseln: 5 painting clauses German landlords still try to sneak in"
2. "Mietpreisbremse 2026: how to know if your Berlin rent is illegal in 2 minutes"
3. "Staffelmiete vs Indexmiete vs Festmiete: which lease type is worst for tenants?"
4. "Anmeldung in Germany: the 14-day window and what to bring"
5. "Kaution Recovery: how to get your full deposit back when leaving Germany"

Each ends with: "Get your specific Mietvertrag analyzed → klausel.app/review for €19."

### Realistic week-1 outcome

| Metric | Conservative | Mid | Optimistic |
|---|---|---|---|
| Unique visitors | 500 | 2,000 | 8,000 |
| Sample-report views | 25 | 150 | 800 |
| One-shot conversions | 1-3 | 5-15 | 30-80 |
| One-shot revenue | €19-57 | €95-285 | €570-1,520 |
| Pro upgrades (10% of one-shot) | 0-1 | 1-2 | 5-10 |

Even the conservative case clears the "first paying customer in week 1" goal.

### Triage if first 48h shows zero conversions

- Pricing too high → A/B test €9 / €15 lookups
- Sample report unconvincing → rebuild with stronger flagged-clause callouts
- Landing copy not landing → rewrite hero with specific dollar-loss framing
- Reddit posts removed by mods → shift to LinkedIn DMs + Twitter + Facebook groups

## Risks & compliance

### RDG (Rechtsdienstleistungsgesetz)

Klausel's analytical core (clause flagging + bilingual translation + BGH/BGB citations) is almost certainly NOT Rechtsdienstleistung — same shape as Mineko's audit reports, which Stiftung Warentest reviewed without RDG concerns.

Gray-zone hardening:

- Frame Pro letters (Kaution Recovery, Kündigung, Mieterhöhung-Widerspruch) as **templates the user fills in and sends themselves** — never "we send for you"
- Never claim to "represent" or "act on behalf of" the user
- Never take a % of recovered rent (that crosses into Inkasso, regulated under §10 RDG)
- "Not legal advice" disclaimer per page + footer
- Always offer escalation: "For binding advice, consult a Rechtsanwalt or Mieterverein"

**Pre-launch:** spend €300-500 on a one-hour consultation with a German Anwalt für Medienrecht / IT-Recht to review T&Cs + disclaimers + output framing. Cheap insurance against a cease-and-desist.

### DSGVO

Pre-launch checklist:

```
[ ] Impressum live at /impressum (Levin Schwab + Gewerbe address from your Gewerbeanmeldung)
[ ] Datenschutzerklärung at /datenschutz (mention all subprocessors: Anthropic, Supabase, Stripe, Resend, Vercel, PostHog)
[ ] AGB at /agb (incl. Kündigungsbutton path, refund policy, liability cap)
[ ] DPAs signed: Anthropic, Supabase, Stripe, Resend, Vercel, PostHog
[ ] Disclaimer on every report page + footer: "Klausel ist keine Anwaltskanzlei..."
[ ] One-click cancel for Pro subscription
[ ] /account/delete deletion endpoint working
[ ] 30-day auto-delete cron for uploaded PDFs working
[ ] Data residency: use Anthropic's EU endpoint if available; otherwise document US transfer + SCCs
[ ] Verzeichnis von Verarbeitungstätigkeiten — internal record of processing
```

PostHog configured server-side → no browser cookies → no cookie consent banner needed.

Total compliance setup: ~6-8 hours. Done Day 1-2 of build week.

### AI accuracy / liability

- Confidence scores on every flag (not "this is illegal" — "WARN based on BGH VIII ZR 47/04")
- Refusal logic: low-confidence cases output "consult a Rechtsanwalt"
- No guarantees in copy — say "we find the most common illegal clauses" not "every"
- AGB liability cap at purchase price (€19), per German B2C law with explicit disclosure
- **Berufshaftpflichtversicherung** (~€200-500/yr) — IT-Dienstleister liability insurance, in place before launch

### Operational risks

| Risk | Mitigation |
|---|---|
| Anthropic API outage | Stripe webhook retries; queue with retry; auto-refund after 24h no delivery |
| Long PDFs (50+ pages, scanned) | Page chunking; OCR fallback (Tesseract.js); refund + manual review if AI fails |
| Concurrent uploads exceed Vercel function limits | Move to background job queue (Inngest) by week 2-3 |
| Email deliverability | Warm `klausel.app` domain gradually; SPF + DKIM + DMARC Day 1 |
| VAT (Kleinunternehmer threshold €22k/yr) | Track revenue; Stripe handles VAT display when configured |

### Adversarial / abuse vectors

| Vector | Mitigation |
|---|---|
| Prompt injection in lease PDF | Treat all PDF content as untrusted data; system prompt explicitly forbids rule-changes from user content; structured JSON schema validation |
| Refund abuse | 7-day window; track download/access logs; refund auto-approved if PDF not downloaded |
| Free-tier scraping | Rate limit (10 lookups / IP / hour); Cloudflare Bot Management on hot endpoints |
| Bulk uploads (single email floods) | 5 reports / 24h / email cap on Pro; surge alert if exceeded |
| Adversarial leases crafted to crash AI | Input sanitization; 10MB / 50-page size limits; error → generic refund flow |

### Edge cases

| Edge case | Handling |
|---|---|
| User uploads non-Mietvertrag (e.g., GmbH contract) | AI detects, returns "Doesn't look like a Mietvertrag" + auto-refund |
| Commercial property lease | Detect via § references, return "Commercial leases need a different tool, refund processed" |
| Non-German lease (Austrian, Swiss) | v1: refuse Austrian/Swiss (different law); accept English-translated DE leases |
| Furnished short-term rental | Detect, warn ("different rules apply"), still process |
| One-shot user upgrades to Pro mid-flow | Apply €19 credit toward first month of Pro |
| Lease updated after report (renegotiation) | Pro: free re-analysis; one-shot: 50% off second analysis |

## Success metrics

| Horizon | Metric | Target |
|---|---|---|
| Week 1 | First paying customer | ≥ 1 |
| Week 1 | One-shot conversions | 5-15 (mid case) |
| Week 1 | Revenue | €95-285 (mid case) |
| Week 1 | Sample report → checkout conversion | ≥ 5% |
| Week 1 | Visitor → sample report view | ≥ 7% |
| Month 1 | Pro subscribers (annual) | ≥ 10 |
| Month 1 | Total MRR-equivalent (one-shot + Pro annual + monthly) | ≥ €500 |
| Month 1 | Refund rate | ≤ 5% |
| Month 3 | Pro MRR | ≥ €1000 |
| Month 3 | NPS (sample of buyers) | ≥ 40 |

## Open questions / decisions deferred

These need resolution but don't block the implementation plan:

1. **Domain availability** — confirm `klausel.app` is free; pick fallback if not. (D1 task)
2. **Anwalt consultation** — Levin to find German IT-Recht / Medienrecht Anwalt for ~€300-500 one-hour T&Cs review. (D1-2 task)
3. **VAT status** — confirm Kleinunternehmer (revenue < €22k) vs full VAT for Stripe configuration. (D1 task)
4. **Berufshaftpflichtversicherung provider** — research and quote (Hiscox, Allianz, Hannoversche have IT-services policies). (D1 task)
5. **Optiver compliance** — Levin's Gewerbeanmeldung memory says "scope deliberately broad (Software/Web/Mobile/...)" so Klausel falls in scope. Confirm no specific re-disclosure needed. (D1 task)
6. **Knowledge base curation** — final list of ~30-50 BGH judgments. Curation work for D2-3.
7. **Sample report content** — fictional Berlin lease with 3 illegal clauses + 1 Mietpreisbremse violation. Build by D4.
8. **Pricing A/B test plan** — test €19 vs €15 vs €29 if conversion < 3% by D7.
9. **TikTok/Reels videos** — defer to week 2+ unless time allows in week 1.
10. **Referral program** — defer to week 4 (skip in week 1 to keep scope tight).

## Out of scope (explicitly NOT building)

- Inkasso / lawyer-led legal action (CONNY territory, requires §10 RDG registration)
- German-language-first product (we are EN-default by deliberate positioning choice)
- Mobile native app (web-only, mobile-responsive)
- B2B landlord-side product (different audience, different liability)
- Real-money trading or financial-product features (Optiver compliance)
- Auto-filing with Behörden / courts (RDG gray zone, defer permanently)

## Appendix — references

- BGB (Bürgerliches Gesetzbuch) §§ 535-578a — German rental law
- RDG (Rechtsdienstleistungsgesetz) § 2 — definition of regulated legal services
- TMG (Telemediengesetz) — Impressum and digital service requirements
- DSGVO / EU 2016/679 — GDPR
- BGH judgments curated in `kb/bgh-judgments.json` (build during week 1)
- Mietspiegel sources per city — build into `kb/mietspiegel-2026.json`
- gesetze-im-internet.de — public-domain legal text
- dejure.org, openjur.de — public legal databases for case law

---

**Status:** approved across all sections (brand/flow, architecture, pricing, distribution, risks). Ready for implementation plan.
