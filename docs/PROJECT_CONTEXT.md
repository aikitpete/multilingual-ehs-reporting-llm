# Project Context

The founding brief for 안전톡 (AnjeonTok), as given by Peter on 2026-09-24.
This is the source material the pitch deck, mockups, and dashboards were
built from — kept verbatim (lightly organized) so later sessions don't have
to reconstruct it from the deck's own paraphrased slide copy.

## Why now — the regulatory/funding research

Re-verified by web search on 2026-09-25 (see `docs/RESEARCH.md` for the full
source-by-source breakdown). Status of each claim used in the deck:

- **2027 Labor Ministry budget, industrial-safety AI assistant: ₩3.8B**
  — **confirmed**. MOEL's 2027 budget proposal (₩38.9537T total, +3.4%)
  includes a ₩3.8B ("38억원") line item for a labor/industrial-safety AI
  service.
- **₩2B for worker-reporting technology and site demonstrations** — **not
  confirmed as a single named line item.** The closest matching items in
  the same budget are foreign-worker-specific: ₩1.2B for basic safety/health
  education and ₩1.0B for specialized industrial-accident-prevention
  support (₩2.2B combined, plus a separate ₩0.25B human-rights-leader
  program). The deck's combined **₩5.8B** figure (₩3.8B + ₩2B) is Peter's
  own framing of these two budget pushes together; only the ₩3.8B half is
  independently verified against a single confirmed line item.
- **286 investigated construction-industry fatal-accident deaths, 2025** —
  **confirmed**. MOEL's own 2025 industrial-accident statistics (published
  March 2026) put construction deaths at 286 (+10, +3.6% YoY), against 605
  total industrial fatalities across all sectors — so 286 is the
  construction subset of that larger number, not a conflicting figure.
- **September 22, 2026: Korea's labor office published accident-prevention
  material specifically for foreign workers on construction sites** — **not
  independently confirmed** as a specific dated publication. What IS
  confirmed, and stronger: Korea's National Assembly passed an OSH Act
  amendment on **June 18, 2026** creating a new employer duty to ensure
  foreign workers complete basic safety/health education (기초안전보건교육),
  plus a companion requirement for electronic card terminals at
  construction sites for foreign-worker attendance tracking. Fines up to
  ₩3,000,000; effective 6 months after promulgation. See
  `docs/RESEARCH.md` §2b — this is the citable legal event this project is
  built around, even though the exact Sept 22 date remains unconfirmed.
- **Expanding multilingual safety education** — **confirmed** as a general
  direction (MOEL foreign-worker safety-education budget lines above,
  MOEL/MOLIT joint multilingual signage program, ongoing multilingual
  video/poster/leaflet development).

### The legal change, precisely — confirmed 2026-09-25

- **Before**: employers already had to give foreign workers the same
  hiring/periodic safety training as Korean workers; E-9/H-2 workers also
  received safety education during employment-entry training.
- **New amendment (산업안전보건법, passed 2026-06-18)**: employers get an
  explicit, newly created duty to ensure every foreign worker they hire
  completes basic occupational safety/health education
  (기초안전보건교육) — this obligation didn't exist before. The same bill
  requires electronic card terminals (전자카드 단말기) at construction
  sites for foreign-worker attendance tracking. Violation: fines up to
  ₩3,000,000. Takes effect 6 months after promulgation. The government's
  stated rationale is exactly the deck's framing: foreign workers face
  higher accident risk from language barriers and unfamiliar workplaces,
  with insufficient training access before this.
- The 2026 multilingual-materials push (KOSHA training content in up to 16
  languages, joint MOLIT/MOEL multilingual signage) operationalizes the
  same direction. Full citations: `docs/RESEARCH.md` §2b.

### Cultural & structural context — why reporting is genuinely hard

- **Multi-layer subcontracting (원청→하청)** diffuses safety
  responsibility: high-risk work concentrates on subcontracted workers
  (disproportionately foreign), while the authority and budget to fix a
  hazard sits with the primary contractor. Korean subcontracting law is
  explicitly framed around preventing unfair practices from this
  hierarchical "dominance/subordination" relationship — it's a structural
  fact, not just a cultural observation.
- **E-9 visa dependency** gives an employer major leverage: a worker can
  change employers only a limited number of times and generally needs the
  current employer's consent (or hard-to-prove evidence of an employer
  violation) to transfer. Leaving without permission makes a worker
  undocumented. This creates a real chilling effect on reporting anything
  that might be read as making trouble for the employer.
- **Why this matters for the product**: the 2026-09-25 decision to hide a
  worker's language from their supervisor isn't just a privacy nicety —
  minimizing what identifies a specific worker to people with power over
  their visa status is close to a precondition for the tool being usable
  by this population at all. See `docs/GOVERNANCE.md` for the full actor
  model this informs.

**Caution (updated 2026-09-25, see `DECISIONS.md`):** the 286 figure and the
₩3.8B AI-assistant budget line are now independently confirmed against
official MOEL sources. The ₩2B "worker-reporting technology" line and the
exact September 22, 2026 government-publication date remain Peter's own
sourced claims, not fully Claude-verified — cite them as given, don't
strengthen them (no implied government adoption, no invented
accuracy/pilot statistics).

## Who the product is for

Foreign construction workers who speak **Vietnamese, Uzbek, or Chinese**
(the original target audience), plus **English** for an English-speaking
pitch audience. **Korean was added 2026-09-25** as a full interface language
(a supervisor is usually a Korean speaker, and the merged mockup's Settings
now serves both roles) — **Vietnamese stays the default** language on
first open, per Peter's instruction.

## The core workflow (kept brutally small)

1. Select language: Vietnamese / Uzbek / Chinese / English.
2. Hold a button and describe the hazard (voice or, per later refinement,
   typed text).
3. Provide:
   - Photo, with the danger area marked
   - Hazard category
   - Severity
   - Location
   - Description
4. AI generates a professional **Korean dashboard/report for managers**,
   with an option to **generate printable warning labels** for the hazards
   found.

Collected report data doubles as **training material**, delivered back to
workers through the same mobile app. AI also generates a professional
**Korean dashboard/report for government** (aggregate/compliance view).

## The deliverables

All shipped as Claude Artifacts (see `README.md` for live links). Originally
five separate pieces; the two mobile mockups were merged into one artifact
on 2026-09-25 (see `DECISIONS.md`):

1. Presentation slides — problem, solution, demo
2. Mobile app mockup — one artifact, a toggle outside the phone frame
   switches between the supervisor's reporting view and the worker's
   training/report view (no real iOS build)
3. Management dashboard for reporting, including an ordering/design page
   for warning labels in Korean + the worker's native language
4. Government dashboard for collecting the data they need

## Where this sits relative to `task-force`

Not one of the five F-1-D goals `task-force` tracks. See that repo's
`docs/SYSTEMS_MAP.md` / `docs/GOALS.md` for what those five goals are, and
this repo's own `docs/DECISIONS.md` for why this stayed a separate repo.
