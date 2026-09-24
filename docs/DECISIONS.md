# Decisions

Dated, most recent first. Record *why*, not what (the artifacts/git history
show what).

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
