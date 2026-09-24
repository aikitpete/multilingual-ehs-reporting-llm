# 안전톡 (AnjeonTok) — safety-kr

AI-assisted worker-hazard reporting for Korean construction sites, sized to
the 2027 Labor Ministry budget (₩3.8B industrial-safety AI assistant line +
₩2B worker-reporting tech/demos) and the new amendment requiring employers
to ensure newly hired foreign workers complete basic safety/health
education.

Not part of `aikitpete/task-force` — separate venture, not yet linked to any
F-1-D goal. See `docs/DECISIONS.md` for why.

**Name:** 안전톡 (AnjeonTok) — 안전 ("safety") + 톡, the same "talk" suffix
Koreans already read as chat/messaging from KakaoTalk. Bilingual, and the
Korean half reads as "safety chat" without translation. `safety-kr` remains
the repo/codename; 안전톡 is the product-facing brand used in the deck and
mockups.

## The pitch

Foreign construction workers (Vietnamese / Uzbek / Chinese / English
speaking) pick their language **once**, then report hazards by voice:

1. Hold a button, describe the hazard.
2. Add a photo (mark the danger area), hazard category, severity, location,
   description.

The AI turns that into:
- A professional **Korean-language report for site managers**, with an
  option to generate printable warning labels (Korean + the worker's
  language) for what was found.
- A professional **Korean-language dashboard for government**, aggregating
  the same data for compliance reporting.

Collected photos/reports double as training material, delivered back to
workers through the same mobile app.

## Deliverables

All built as Claude Artifacts (no code repo yet — see `docs/DECISIONS.md`
for why artifacts-first). One link to all of them: the
[demo index](https://claude.ai/artifact/9yQt4JXfhugfVSZFfc59qc), now grouped
into **Slide decks** and **Prototypes**.

### The deck

- [x] **HTML deck (Title / Problem / Solution / Demo)** — plain HTML, large
      TV-friendly type, real animation and multi-page PDF export. This is
      the only deck now — see `docs/HANDOFF.md`.
      — https://claude.ai/artifact/GD94Scrk1hUGMjoFTfND9S

  The two earlier 7-slide Slides-format decks (the original "Pitch deck" and
  the from-scratch "AnjeonTok Launch Deck" redesign) have been deleted; this
  HTML deck fully replaced them.

### Prototypes

- [x] Mobile app mockup — supervisor & worker, one page with a toggle
      outside the phone frame to switch modes (mockup only, no real iOS
      build) — https://claude.ai/artifact/1BcqqqNseS5SCXSHTjS7Ty
- [x] Management dashboard — reporting + an ordering/design page for
      warning signage in Korean + the worker's native language
      — https://claude.ai/artifact/W7QuAyMGnjkjT1CZbXudum
- [x] Government dashboard — the aggregate data view the ministry needs
      — https://claude.ai/artifact/7U9dGUEWVq3m3EKDeSKbUx

### Knowledge

- [x] Knowledge & sources — which regulatory/budget figures on the deck are
      independently confirmed vs. Peter's own sourced claims, with links.
      See `docs/RESEARCH.md` for the full detail.
      — https://claude.ai/artifact/CnfwLoVuvfeqDGvePKhKqJ
- [x] Governance model — six actors (worker, supervisor, safety manager,
      business owner, government, the system itself), each with
      MUST/SHOULD/CAN obligations tagged to a system capability, meant to
      seed future use-case/requirements work. See `docs/GOVERNANCE.md`.
      — https://claude.ai/artifact/VZEtVvrA6tYLZsiB2baQ81
- [x] Pitch prep — a hackathon-jury simulation: likely praise, the
      toughest questions, and answers to rehearse.
      — https://claude.ai/artifact/AG1MU26YztcmnjRirYJGKu

### Sample reports

Two generated PDF reports, matching the deck's "one report, four outputs"
diagram, linked from the demo index's **Reports** group (open in the
browser's native PDF viewer). Source HTML + PDF kept in `reports/`.

- Site Safety Report — one worker's hazard report, structured for a site
  supervisor.
- Compliance Report — aggregate compliance data for government & legal
  review (no individual report content, per the governance model's access
  rules).

All artifacts are **private** until shared from each page's Share menu.

## Deploying the static site (`site/`)

`site/` holds standalone, portable HTML exports of the HTML deck and the four
prototypes (the two Slides-artifact decks can't be exported this way — they
render through Claude's proprietary Slides runtime, not plain HTML — so the
demo index links out to claude.ai for those two). Cross-links between pages
use relative paths (`deck.html`, `supervisor.html`, etc.) so the whole thing
works as one self-contained site.

To deploy on Netlify (repo is private; Netlify's GitHub App supports private
repos):
1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import
   an existing project** → GitHub → select `aikitpete/safety-kr`.
2. Build settings: no build command needed (static files). Publish
   directory: `site` (already set in `netlify.toml` at the repo root, so
   Netlify should pick it up automatically).
3. Deploy. The demo index (`index.html`) is the home page.

Each prototype's "Export PDF" button relies on a Claude-Artifact-only
capability (`window.claude`) and degrades gracefully to "PDF unavailable
here" once deployed outside that environment — this is expected, not a bug.

## Status

See `docs/STATUS.md`. Working notes / rationale for the less-obvious calls:
`docs/DECISIONS.md`. Continuity notes for the next session: `docs/HANDOFF.md`.
