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

### The active deck

- [x] **HTML deck (Title / Problem / Solution / Demo)** — plain HTML, large
      TV-friendly type, real animation and multi-page PDF export. This is
      the one being actively iterated on — see `docs/HANDOFF.md`.
      — https://claude.ai/artifact/GD94Scrk1hUGMjoFTfND9S

### Two earlier decks (kept, not actively edited)

- [x] Pitch deck (7-slide Slides artifact) — https://claude.ai/artifact/GJVQ4zRT6Qfc8XnP3FViQq
- [x] AnjeonTok Launch Deck (7-slide Slides artifact, a from-scratch second take)
      — https://claude.ai/artifact/QUy7uxiF875jk7f2txRRuf

### Prototypes

- [x] Mobile app mockup — supervisor view (mockup only, no real iOS build)
      — https://claude.ai/artifact/1BcqqqNseS5SCXSHTjS7Ty
- [x] Mobile app mockup — worker view: training feed + report flow (mockup
      only, no real iOS build) — https://claude.ai/artifact/1osoXtvia9CPKkTZaV1mbk
- [x] Management dashboard — reporting + an ordering/design page for
      warning signage in Korean + the worker's native language
      — https://claude.ai/artifact/W7QuAyMGnjkjT1CZbXudum
- [x] Government dashboard — the aggregate data view the ministry needs
      — https://claude.ai/artifact/7U9dGUEWVq3m3EKDeSKbUx

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
