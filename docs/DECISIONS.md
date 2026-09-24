# Decisions

Dated, most recent first. Record *why*, not what (the artifacts/git history
show what).

## 2026-09-25 — Explicit "Generate with AI" buttons; sample PDF reports

Peter asked for explicit LLM-generation buttons rather than content that
was already just showing up reactively — the point of the demo is to
showcase generation happening, not just display pre-filled data. Added a
"Generate sign with AI" button to Warning Labels (auto-picks the pictogram
and the worker's language, then reveals the sign with a brief simulated
"Generating…" delay), converted the report modal's AI analysis from
always-shown to a "Generate management report" button with the same
pattern, and added a new **Training materials** tab to the Management
dashboard with its own "Generate training material" button — turning a
selected worker report into a training card (photo, translated caption,
quick-check quiz) the same crew would see.

Fixed three bugs surfaced by review before publishing: the sign's
pictogram icon used `currentColor` and inherited the page's dark-mode text
color, making it invisible against the sign's fixed white background
(fixed by hardcoding the icon's color, since the sign itself is
intentionally not theme-adaptive); a "Korean only — add a language above"
placeholder line was unnecessary noise — a Korean-only sign is a
completely valid real sign, so it's just left blank now; and the inline
"Export" / "Export compliance report" links on both dashboards had no
click handler at all — wired them to trigger the existing (working)
floating Export PDF button instead of duplicating its logic.

Generated two sample PDF reports (Site Safety Report, Compliance Report)
via headless Chrome print-to-PDF from hand-built HTML matching the
existing design system, uploaded them as assets on the demo-index
artifact (`assets` capability), and added a new **Reports** nav group
linking to them — they open directly in the browser's native PDF viewer.
Source HTML/PDF kept in this repo under `reports/`; the static `site/`
export gets its own copies under `site/reports/` since `/_blob/` asset
URLs only resolve inside the Claude Artifact sandbox, not on Netlify.

## 2026-09-25 — Rebranded off navy/gold; made the Management dashboard functional

Peter said the shared navy-blue + muted-gold palette "screams corporate/IBM,
not construction." Replaced it everywhere (deck, both mockups, both
dashboards, Knowledge, Governance, demo index) with a construction-coded
palette: neutral graphite/steel darks (not navy blue, and — after a second
round of feedback that the first warm-charcoal attempt "looked like mud" —
desaturated further toward true steel gray) plus safety orange
(`#C97A1F` light / `#FFC629` dark) as the accent, keeping hazard-sign red
and safety green for severity. Applied as a single hex-value substitution
across all files' shared `:root` tokens, not a rewrite of the token
structure itself.

Also fixed a real pre-existing bug this surfaced: `--accent-strong` was
used in a few places as *text* color on a surface (`.btn-link`, the report
modal's language field, Knowledge page source links) but was never
redefined for dark mode, so that text went dark-on-dark and disappeared
for any dark-mode viewer. Fixed by switching those specific text-color
uses to `--accent` (which already has proper light/dark variants),
leaving `--accent-strong`'s background-fill uses (sidebar, buttons, active
chips) alone since those are always paired with fixed light text and were
never actually broken.

The Management dashboard's Warning Labels tab existed but was static — the
report dropdown and language chips didn't change the label preview.
Rebuilt it as a real generator: a 9-report dataset with Korean text and
Vietnamese/Uzbek/Chinese/English translations, driving a preview that
regenerates on report or language change, plus a working quantity stepper
and an order-confirmation toast. Added a "Corrective action" field to the
report modal (closes a gap flagged in the earlier governance-coverage
audit: the Safety & Health Manager's SAPA duty to investigate incidents
and record recurrence-prevention measures had no UI representation).

Added an English/Korean toggle for the Management dashboard's own
interface chrome (nav, stat labels, table headers, form labels) — separate
from the warning-label's own target-language selector, which stays
Vietnamese/Uzbek/Chinese/English since that picks the *worker's* language,
not the dashboard's. Implemented the same way as the mobile mockup's i18n:
an inline `STRINGS` JS object (the closest equivalent to "a language json"
a static Claude Artifact can actually use, since there's no server to
fetch a real `.json` file from) — chrome text only, not table row data or
report content, matching the mockup's established scoping.

Also fixed two deck issues from user review: the June 18, 2026 law
description was corrected to mention BOTH of what it actually mandates
(foreign-worker safety training AND a general construction-site electronic
attendance-tracking requirement, not a foreign-worker-specific tracking
mandate as first drafted) and dropped the inaccurate "new hires" framing;
and the Solution slide's 4-output diagram had a real CSS bug (the second
output box used `position: relative` left over from the original 3-output
version instead of `position: absolute`, which pulled it into normal
document flow and made it render on top of the first box).

## 2026-09-25 — Fixed the mockup's page chrome: toggle, phone case, removed the hand

Peter's feedback on the merged supervisor/worker mockup, in order:
- The "PROTOTYPE" corner ribbon and the hand-holding-the-phone illustration
  both read as tacky — removed both entirely rather than trying to refine
  them.
- The mode toggle ("Reporting"/"Training") was translating into the app's
  current language, but it's page chrome, not app content — it now always
  reads in English regardless of the selected language, matching the page
  banner underneath it.
- The toggle was floating to the left of the phone instead of centered
  above it — root cause was a missing `flex-direction: column` on `body`
  (an oversight from when the toggle was first added — the CSS assumed
  column layout that was never actually applied), so the toggle and the
  phone-case were laying out as row siblings instead of stacking. Fixed,
  and gave the toggle a normal centered gap above the case instead of the
  earlier "mounted onto the case" negative-margin trick.
- The rugged case redesigned for realism: removed the bright yellow-ringed
  circular corner "bumpers" (read as toy-like), added a real rubberized
  texture (subtle diagonal noise gradient), a two-tone bevel (inset
  highlight + shadow rings) for a molded-plastic look, and kept only the
  bottom hazard-stripe tread and a simplified lanyard loop as the
  case's brand-relevant details.

## 2026-09-25 — Added a Governance model page; found the actual 2026 law

Peter asked for research into the roles of the key actors in the system and
a governance model (MUST/SHOULD/CAN per actor), reusable later for
use-case/requirements work, plus research into how Korean construction
companies actually operate culturally, with focus on this year's
amendment. Two findings changed earlier docs materially:

1. **The real 2026 legal amendment is now confirmed with a date.** Korea's
   National Assembly passed an OSH Act amendment on **June 18, 2026**
   creating a new employer duty — foreign workers must complete basic
   safety/health education — plus a companion electronic-card-terminal
   requirement at construction sites. This upgrades the deck's employer-
   duty claim from "Peter's own sourced claim" to independently confirmed
   (the Sept 22, 2026 date specifically is still unconfirmed — kept
   separate). See `docs/RESEARCH.md` §2b.
2. **Structural/cultural context** — Korea's multi-layer 원청/하청
   (primary contractor / subcontractor) structure diffuses safety
   responsibility, and E-9 visa dependency (limited employer transfers,
   employer consent needed) creates a real disincentive for a foreign
   worker to report anything that could upset their employer. This isn't
   just background color — it's the concrete justification for the
   2026-09-25 decision to hide a worker's language from their supervisor:
   for this population, minimizing what identifies a specific worker is
   close to a precondition for a usable tool, not an optional privacy
   nicety. See `docs/RESEARCH.md` §6 and `docs/GOVERNANCE.md`.

Published a new **Governance model** artifact (six actors — Foreign
Worker, Site Supervisor, Safety & Health Manager, Business Owner,
Government, and the AnjeonTok System itself — each with MUST/MUST NOT/
SHOULD/SHOULD NOT/CAN/CANNOT obligations tagged with a "→ system
capability" so a future session can turn this directly into requirements)
and added it to the nav's existing Knowledge group as a second item,
rather than a new nav group, since it's "another page" of the same kind of
reference material.

## 2026-09-25 — Re-verified the law/budget claims; added a Knowledge page and Korean

Peter asked for detailed research on the law and project assumptions. A new
web-search pass (see `docs/RESEARCH.md`) found stronger sources than the
2026-09-24 pass: the ₩3.8B industrial-safety AI budget line and the 286
construction fatalities (2025) figure are now independently **confirmed**
against official MOEL sources. The ₩2B "worker-reporting technology" half
of the deck's combined ₩5.8B figure, and the exact September 22, 2026
publication date, remain **Peter's own sourced claims** — not strengthened,
not presented as confirmed, cited as given per the standing rule in
`PROJECT_CONTEXT.md`.

Added a new **Knowledge** artifact summarizing this research for anyone
reviewing the pitch, and a third nav group on the demo index ("Knowledge",
alongside "Slide deck" and "Prototypes") linking to it — a summary page
was requested explicitly rather than folded into an existing deliverable,
so it gets its own artifact and its own nav group rather than being
squeezed into the deck or README.

Peter asked for the mockup's translations to come from "a language json."
Implemented as an inline `STRINGS` JS object (one entry per language, keyed
by string id) rather than a separate `.json` file fetched at runtime —
Claude Artifacts are static, sandboxed pages with no server to fetch a
sibling file from, so an inline object is the closest equivalent that
actually works; it's structured identically to how a real JSON file would
look, just embedded in the page's own script. All report-list language
labels (e.g. "Vietnamese · 6 min ago") were also removed per Peter's
request — hazard reports no longer name the reporter's language anywhere
in the UI.

Also added **Korean** as a full interface language in the merged mockup's
Settings (Peter asked for this explicitly, since a supervisor is typically
a Korean speaker) — Vietnamese stays the default per his instruction. Also
combined slide 4 (Demo)'s single example into two, and added a "beyond
construction" row naming three applicable industries (Construction,
Manufacturing, Shipbuilding — the third chosen because Korean shipyards
share the same foreign-worker-safety-language problem and are a large,
well-known industry locally, making the generalization credible without
research to back a specific claim about it).

## 2026-09-24 — Two Slides decks deleted; supervisor/worker mockups merged into one artifact

Peter asked to remove the two older 7-slide Slides-format decks now that the
HTML deck fully replaced them — deleted both (`GJVQ4zRT6Qfc8XnP3FViQq`,
`QUy7uxiF875jk7f2txRRuf`); their URLs are gone for good, so every nav
menu/demo-index/README/HANDOFF reference to them was removed rather than
left dangling.

He also asked for the supervisor and worker mobile mockups to live on one
page with a mode toggle placed outside the phone frame (not a tab inside
it, so it reads as "which app am I looking at" rather than an in-app
control), plus a more realistic phone chrome. Merged worker's markup/CSS/JS
into the supervisor artifact (`1BcqqqNseS5SCXSHTjS7Ty`), deleted the
now-redundant worker artifact, and renumbered the demo index's Prototypes
list from 4 items to 3. Added a dynamic-island-style notch and side
buttons to the shared phone-frame CSS for the realism ask. The static
`site/` export and every prototype's cross-links were re-synced to match.

## 2026-09-24 — Repo stays private; static site added under `site/` for Netlify

Peter asked for "a proper public repo... that deploys to Netlify." When asked
directly, he chose to **keep the repo private** rather than flip it public —
Netlify's GitHub App supports deploying from private repos, so this loses
nothing functionally. He also chose to connect Netlify himself via their
dashboard (2-minute manual step) rather than have this session install and
authenticate the Netlify CLI, since that would need his login in the loop
anyway and shares no credentials either way.

Added `site/` with portable, standalone HTML exports of the HTML deck and
the four prototypes, cross-links rewired from `claude.ai/artifact/...` URLs
to relative filenames (`deck.html`, `supervisor.html`, etc.) so the exported
copies work as one self-contained site independent of the Claude Artifacts
platform. The **two Slides-artifact decks (Pitch deck, AnjeonTok Launch
Deck) could not be included** — they render through Claude's own Slides
runtime (a proprietary app, not plain HTML), so there's no static export
path for them; the site's index links out to their claude.ai URLs instead.
`netlify.toml` at the repo root sets `publish = "site"`. This is also the
**first time this session's HTML source files were actually committed to
the repo** — until now everything lived only as published Claude Artifacts
and local scratchpad files, never in git.

## 2026-09-24 — Three deck artifacts exist; the plain-HTML 4-slide deck is now primary

The pitch deck went through several full rebuilds in one session: a 6-slide
Slides-artifact deck, then a 7-slide "closed-loop product" Slides-artifact
rebuild (kept as **AnjeonTok Launch Deck**, a second, visually distinct take
per Peter's "build it from scratch, don't reuse the layout" instruction), then
a **third deck built as plain HTML** (not the Slides artifact type) so it
could use real CSS/JS: scroll-snap paging, scroll-triggered reveal animation,
a Ken Burns hero photo, and genuine multi-page PDF export (each slide its own
PDF page via html2canvas + jsPDF, not a screenshot of one view).

Peter then asked to condense that HTML deck to **4 slides — Title, Problem,
Solution, Demo — with TV-screen-friendly (large, sparse) text**, and said
**"from now focus only on the HTML slide."** That HTML deck
(`https://claude.ai/artifact/GD94Scrk1hUGMjoFTfND9S`) is the one to keep
iterating on going forward; the two Slides-artifact decks still exist and are
still linked from the nav page, but are no longer the active target for
edits unless Peter says otherwise.

Two content corrections made during the condensing pass, both from direct
feedback, worth remembering as house rules for this deck:
- **No "ask."** An early close ("One Korean worksite. Six weeks...") was
  removed — Peter's framing: "we are just pitching, nothing else." Don't
  re-add a pilot/deployment ask unless asked to.
- **No lofty closing lines.** "Report it once. Protect the site every time
  after." was flagged as too grandiose; replaced with a plain "That's
  안전톡. Thank you." Prefer flat, concrete language over anything that reads
  like a tagline in the closing line specifically.
- **Cryptic motifs need their explanation on-screen, or they get cut.** The
  REPORT→ACT→WARN→TRAIN→LEARN word-strip on the title slide worked in the
  7-slide version because later slides unpacked each word; once condensed to
  4 slides nothing explained it anymore, so it read as jargon and was
  removed. Lesson: don't reuse a device across a rewrite without checking
  whether the content that justified it survived the rewrite too.
- **Vivid, concrete, labeled-as-illustrative anecdotes beat abstract stats.**
  Added two short "EXAMPLE"-tagged anecdote lines with photos (exposed wiring
  by a puddle; materials blocking a fire exit) alongside the 286 stat and the
  signature worker→Korean-report transformation, per Peter's request for
  "practical examples... short, vivid, anecdotal." Kept explicitly labeled
  EXAMPLE so they read as illustrative scenarios, not fabricated incident
  reports — matches the standing rule (see the credibility notes throughout
  this file) against inventing traction or real case data.

## 2026-09-24 — Product name: 안전톡 (AnjeonTok)

Considered an English-only name (SiteVoice) first; Peter asked for a
Korean-English name that both reads well to Korean customers (government,
site managers) and explains the problem on sight. Landed on 안전톡
(안전 = safety + 톡, the "talk" suffix from KakaoTalk) because the Korean
half needs no translation to be understood as "safety chat/report," and the
romanization (AnjeonTok) still works in English-language slides. `safety-kr`
stays as the repo/codename; 안전톡 is customer-facing.

## 2026-09-24 — Repo location: standalone GitHub repo, not inside task-force

Peter chose "brand new git repo" over folding this into `task-force` or
building it only as a loose Cowork artifact. Reasoning: this may eventually
need real code (mobile app, dashboards) beyond what an artifact can host,
and it's explicitly *not* one of the five F-1-D goals `task-force` tracks
(see that repo's `docs/GOALS.md`) — keeping it separate avoids polluting
that repo's goal-tracking scope. Created as `aikitpete/safety-kr`, private.

## 2026-09-24 — Deliverables built as Claude Artifacts, not code

All five deliverables (deck, 2 mobile mockups, 2 dashboards) are Claude
Artifacts rather than a checked-in web app. Reasoning: this is a pitch/demo
stage — no backend, no real data, no auth — and Artifacts let each piece be
iterated and shared as a link immediately. If this moves past pilot
conversations into an actual build, that's the trigger to start real code in
this repo (mirrors `task-force`'s own artifact-first pattern, see that
repo's `docs/ARCHITECTURE.md`).

## 2026-09-24 — Language selection is one-time, not a per-report step

Early solution-slide/demo draft showed "pick a language" as step 1 of the
repeating report flow. Peter corrected this: language is chosen once at
setup, not asked again per report. Implemented as:
- Worker mobile mockup: a one-time language gate on first load, persisted
  via `localStorage`; only reopens if the user deliberately taps the
  language badge.
- Deck solution slide: language shown as a quiet "set once" badge next to
  the headline, not one of the flow cards — the flow cards are only the
  parts that repeat (hold & describe → AI writes it up).

## 2026-09-24 — Real photos via AI image generation, not stock/gradients

Peter asked for "proper images" (title-slide background, hazard-photo
examples) instead of CSS gradient placeholders. Generated via the
ElevenLabs/Workspace image tool (`bytedance-seedream-5-pro`): one
construction-site hero photo (deck cover background) and two hazard
example photos (broken guardrail, exposed wiring). A fourth (blocked fire
exit) hit the workspace's free-tier daily image-generation cap and was not
generated — that item still uses a plain gradient thumbnail in the
supervisor/worker mockups. Regenerate it once the cap resets if a real
photo is wanted there too.

Deck images are uploaded to the Slides artifact's own asset store (required
by the Slides format — `<img src>` there must be an uploaded asset, not a
data URI). The two mockup HTML pages instead embed the same photos as
inline base64 `data:` URIs, to avoid declaring the `assets` runtime
capability on otherwise-static pages just to host two images.

## 2026-09-24 — Verified what web search could confirm about the Korea stats; tightened wording

Ran actual web searches against the four regulatory/stat claims used throughout
the pitch (286 fatalities, the 2026 employer duty, the Sept 22 2026 guidance
publication, the ₩5.8B budget). Results:
- **HABSIDA hackathon dates confirmed**: Sept 24–25, 2026, Incheon — so "2 days
  before this pitch" is arithmetically correct *if* the Sept 22 publication
  date itself is accurate.
- **286 fatalities: not independently confirmed.** Search surfaced a different,
  confirmed figure instead — Korea's Ministry of Employment and Labor reported
  **605 total workplace deaths investigated in 2025** (up from 589 in 2024),
  with construction accounting for roughly half of all workplace deaths.
  286 is in a plausible range for a construction-specific subset but no
  source was found stating that exact number.
- **Sept 22, 2026 announcement: not independently confirmed.** No article
  surfaced describing that specific publication.
- **The 2026 employer duty (basic safety education for newly hired foreign
  workers): not independently confirmed as worded.** Real 2026 revisions to
  Korea's Occupational Safety and Health Act were found (risk-assessment
  worker participation, expanded contractor safety duties, effective ~March
  2026), but nothing matching the specific foreign-worker clause as stated.
- **₩5.8B budget: not checked** (no search run against this one yet).

None of this means the original figures are wrong — Peter's original research
may cite a source (e.g. a specific Korean-language ministry release) that
general English-language web search doesn't surface. But since neither he nor
I have a confirmed primary source in hand, the HTML deck's problem slide was
rewritten to stop **conflating** two separate claims: it previously read as if
the *law itself* was made two days before the pitch. Corrected to say Sept 22
was when guidance was *published*, and the employer-duty law change is a
separate, undated-to-that-day 2026 background fact. Numbers (286, ₩5.8B) were
left as-is — softening or removing them without a confirmed correction would
trade one unverified claim for another. If Peter has the actual source, re-run
verification against that source directly and update this entry.

## 2026-09-24 — Cross-artifact navigation via a floating widget, not shared state

Each of the 5 artifacts is its own origin (Claude Artifacts sandboxing), so
there's no way to share `localStorage` or app state between them. Cross-
navigation is a small floating "Prototypes" button (bottom-right, collapsed
by default) hardcoded with links to the other 4 pieces + the demo index,
added to each page without disturbing its own layout. Links use plain
`<a href>` (no `target="_blank"`) per Peter's request, so they navigate in
the same window by default while cmd/ctrl+click still opens a new tab —
standard browser behavior, no JS needed.
