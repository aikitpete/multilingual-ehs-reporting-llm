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

Live at **https://anjeontok.netlify.app/** (deployed from `site/` on every
push to `master`). The pitch deck is the home page and links to every
prototype, the knowledge/governance pages, and the two PDF reports.

### The deck

- [x] **HTML deck (Title / Problem / Solution / Demo)** — plain HTML, large
      TV-friendly type, real animation and multi-page PDF export. This is
      the only deck now — see `docs/HANDOFF.md`.
      — https://anjeontok.netlify.app/

### Prototypes

- [x] Mobile app mockup — supervisor & worker, one page with a toggle
      outside the phone frame to switch modes (mockup only, no real iOS
      build) — https://anjeontok.netlify.app/supervisor.html
- [x] Management dashboard — reporting + an ordering/design page for
      warning signage in Korean + the worker's native language
      — https://anjeontok.netlify.app/manager.html
- [x] Government dashboard — the aggregate data view the ministry needs
      — https://anjeontok.netlify.app/government.html

### Knowledge

- [x] Knowledge & sources — which regulatory/budget figures on the deck are
      independently confirmed vs. Peter's own sourced claims, with links.
      See `docs/RESEARCH.md` for the full detail.
      — https://anjeontok.netlify.app/knowledge.html
- [x] Governance model — six actors (worker, supervisor, safety manager,
      business owner, government, the system itself), each with
      MUST/SHOULD/CAN obligations tagged to a system capability, meant to
      seed future use-case/requirements work. See `docs/GOVERNANCE.md`.
      — https://anjeontok.netlify.app/governance.html

### Sample reports

Two generated PDF reports, matching the deck's "one report, four outputs"
diagram, linked from the demo index's **Reports** group (open in the
browser's native PDF viewer). Source HTML + PDF kept in `reports/`.

- Site Safety Report — one worker's hazard report, structured for a site
  supervisor.
- Compliance Report — aggregate compliance data for government & legal
  review (no individual report content, per the governance model's access
  rules).

## Deploying the static site (`site/`)

`site/` is the source of truth for everything above: `index.html` is the pitch
deck (home page), the prototypes are sibling pages (`supervisor.html`,
`manager.html`, `government.html`, `knowledge.html`, `governance.html`,
`backend.html`) and the PDF reports live in `site/reports/`.
Cross-links use relative paths, so the site works anywhere it is hosted.

Netlify (`anjeontok.netlify.app`) deploys from this repo; `netlify.toml` sets
the publish directory to `site`, so there is no build step. Pushing to
`master` redeploys.

### Access control

`netlify/edge-functions/auth.ts` runs on every request: a `/login` page, a 30-day
session cookie, `/logout`, and a "Signed in as … · Log out" badge on every page:

| Who | Sees |
|---|---|
| Anyone | the pitch deck (`/`) only |
| `team` login | + supervisor app, management and government dashboards, PDF reports |
| `admin` login | + knowledge & sources, governance model, backend architecture |

Anything not listed in the function is admin-only (default deny). The repo
holds only salted SHA-256 hashes, never the passwords. To rotate one: compute
`sha256("anjeontok-v1:" + newPassword)` as hex, paste it into `USERS` in
`auth.ts`, push. Optional: set a `SESSION_SECRET` env var in Netlify so session
cookies are signed with a secret that isn't in the repo.

Each prototype's "Export PDF" button relies on a Claude-Artifact-only
capability (`window.claude`) and degrades gracefully to "PDF unavailable
here" once deployed outside that environment — this is expected, not a bug.

## Status

See `docs/STATUS.md`. Working notes / rationale for the less-obvious calls:
`docs/DECISIONS.md`. Continuity notes for the next session: `docs/HANDOFF.md`.
