# Project Context

The founding brief for 안전톡 (AnjeonTok), as given by Peter on 2026-09-24.
This is the source material the pitch deck, mockups, and dashboards were
built from — kept verbatim (lightly organized) so later sessions don't have
to reconstruct it from the deck's own paraphrased slide copy.

## Why now — the regulatory/funding research

- **2027 Labor Ministry budget**: ₩3.8B for an industrial-safety AI
  assistant, plus ₩2B for worker-reporting technology and site
  demonstrations. (₩5.8B combined — this is the figure used throughout the
  deck and docs.)
- **September 22, 2026**: Korea's labor office published accident-prevention
  material specifically for foreign workers on construction sites — two
  days before this pitch was first built.
- Korea's Labor Ministry reported **286 investigated construction-industry
  fatal-accident deaths in 2025**, and has been expanding multilingual
  safety education.

### The legal change, precisely

- **Before**: employers already had to give foreign workers the same
  hiring/periodic safety training as Korean workers; E-9/H-2 workers also
  received safety education during employment-entry training.
- **New amendment**: employers get an explicit duty to ensure newly hired
  foreign workers complete basic occupational safety/health education. The
  government cites language barriers and unfamiliar workplaces as the
  reason.
- The September 2026 materials operationalize the same direction: foreign-
  worker fall-prevention videos, QR posters, and combined guidance for
  falls, fires and heat.

**Caution flagged during the deck rewrite** (see `DECISIONS.md`): treat the
286 figure, the exact wording of the employer duty, and the Sept 22 date as
Peter's own sourced research, not something Claude independently verified.
Don't strengthen or extend these claims (e.g. don't imply the government
will buy AnjeonTok, don't invent accuracy/adoption statistics) — cite them
as given, or drop them if they can't be stated cautiously.

## Who the product is for

Foreign construction workers who speak **Vietnamese, Uzbek, Chinese, or
English**.

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

## The five deliverables

All shipped as Claude Artifacts (see `README.md` for live links):

1. Presentation slides — problem, solution, demo
2. Mobile app mockup for supervisors (no real iOS build)
3. Mobile app mockup for training construction workers on collected images
   (no real iOS build)
4. Management dashboard for reporting, including an ordering/design page
   for warning labels in Korean + the worker's native language
5. Government dashboard for collecting the data they need

## Where this sits relative to `task-force`

Not one of the five F-1-D goals `task-force` tracks. See that repo's
`docs/SYSTEMS_MAP.md` / `docs/GOALS.md` for what those five goals are, and
this repo's own `docs/DECISIONS.md` for why this stayed a separate repo.
