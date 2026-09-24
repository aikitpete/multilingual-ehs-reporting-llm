# Handoff

2026-09-24 (updated) — All five pitch deliverables exist and are populated
with mock data. There are now **three** deck artifacts; see below for which
one is actually active. Everything below is what a fresh session needs to
keep going without re-deriving context.

## The one to edit: the HTML deck

**https://claude.ai/artifact/GD94Scrk1hUGMjoFTfND9S** — 4 slides (Title,
Problem, Solution, Demo), plain HTML (not the Slides artifact type), large
TV-friendly type, real CSS animation (Ken Burns hero photo, scroll-triggered
reveals, an animated waveform), scroll-snap keyboard/swipe navigation, and a
working multi-page PDF export. **Peter said "from now focus only on the HTML
slide"** — this is the deck to keep iterating on unless told otherwise. See
`docs/DECISIONS.md` for the two content rules learned while condensing it
(no "ask," no lofty closing lines) — don't reintroduce either without being
asked.

## The other two decks (still linked, no longer the active target)

- **Pitch deck** (Slides artifact) —
  `https://claude.ai/artifact/GJVQ4zRT6Qfc8XnP3FViQq` — 7 slides, one
  continuous hazard-report story.
- **AnjeonTok Launch Deck** (Slides artifact) —
  `https://claude.ai/artifact/QUy7uxiF875jk7f2txRRuf` — 7 slides, a second,
  visually distinct take (different composition/type system) on the same
  content, built when Peter asked for a from-scratch redesign that didn't
  reuse the first deck's layouts.

Both were live-edited through Cowork's own Slides editor at various points in
the session (hence the repeated "someone has since replaced it" version
conflicts in that session's tool calls) — if picking either back up, `read`
the current `project/deck.json` and each slide file fresh before editing.

## The demo index (the one link to everything)

**https://claude.ai/artifact/9yQt4JXfhugfVSZFfc59qc** — now split into two
groups: **Slide decks** (all three above) and **Prototypes** (the four below).
Update this page whenever a new deck/prototype is added or an existing one's
URL changes.

## The four prototypes

- Supervisor mobile mockup — `https://claude.ai/artifact/1BcqqqNseS5SCXSHTjS7Ty`
- Worker training mobile mockup — `https://claude.ai/artifact/1osoXtvia9CPKkTZaV1mbk`
- Management dashboard — `https://claude.ai/artifact/W7QuAyMGnjkjT1CZbXudum`
- Government dashboard — `https://claude.ai/artifact/7U9dGUEWVq3m3EKDeSKbUx`

All four share one visual system (navy/yellow/off-white/hazard-red, same
phone-frame chrome with a real status bar + home indicator, a floating
"Prototypes" nav widget + "Export PDF" button on every page) and real
click-through interactivity: the supervisor app's report list opens a detail
overlay and back button that actually work, filter tabs actually filter, the
worker app has a working Speak/Type toggle and a Settings tab where language
lives (chosen once, not a blocking gate), and the management dashboard's
report rows open a modal that reveals the worker's language (hidden from the
main table by request).

All artifacts are **private** — Peter needs to share each from its page's
Share menu before anyone outside this session can open the links.

## Known gaps / open threads

- **Stats not independently verified.** Web search (2026-09-24) could not
  confirm the exact 286 fatalities figure, the Sept 22 2026 publication, or
  the precise wording of the 2026 employer-duty law change — see
  `docs/DECISIONS.md` for what search found instead and how the HTML deck's
  wording was adjusted to stop overstating the connection between two
  separate claims. If Peter supplies the original source, re-verify against
  it directly.
- **A fourth hazard photo (blocked fire exit) is now real**, supplied by
  Peter directly (not generated) — already integrated into the supervisor/
  worker mockups and the HTML deck's Demo slide anecdote.
- **No real screenshots of the interactive prototypes exist in any deck.**
  Each artifact is a separate sandboxed origin; Claude cannot screenshot a
  private artifact into another artifact. The decks use faithful hand-built
  recreations of the real UI instead. Peter has been asked (pending answer)
  whether he wants to supply real screenshots for the Demo slide.
- **Two open questions Peter has not yet answered** (asked 2026-09-24,
  dismissed without a reply — do not assume answers, wait for him to raise
  it again): who exactly is judging/watching the pitch (affects tone), and
  whether to keep the 286/Sept 22 stats as-is, soften them, or re-verify
  against his original source.
- **`docs/ARCHITECTURE.md`, `docs/REQUIREMENTS.md`, `docs/BACKLOG.md`,
  `docs/PROJECT_CONTEXT.md`** — `PROJECT_CONTEXT.md` now exists (the founding
  brief); the other three still don't, because there's no code and no fixed
  requirements yet — this is still a pitch/demo, not a build.
- **No local copy of any artifact's source lives in this repo.** Everything
  is authored and published directly as Claude Artifacts from a session's
  scratchpad. Consider mirroring source into a `prototypes/` folder here if
  cross-session continuity becomes a bigger problem than it has been.
- **Not linked to any task-force F-1-D goal** — revisit if this becomes a
  real revenue line (see `docs/DECISIONS.md`).

## If you're picking this up cold

1. Read `docs/DECISIONS.md` first, especially the two most recent entries —
   they cover the HTML deck's content rules and the stat-verification gap.
2. Open the [demo index](https://claude.ai/artifact/9yQt4JXfhugfVSZFfc59qc)
   to see current state of everything before changing anything.
3. Unless told otherwise, edit **only the HTML deck**
   (`GD94Scrk1hUGMjoFTfND9S`) — the two Slides decks are frozen unless Peter
   explicitly asks for more work on them.
4. To edit any artifact, you need this exact conversation's Artifact `url` —
   publishing without it creates a *new* separate artifact instead of
   updating the existing one.
