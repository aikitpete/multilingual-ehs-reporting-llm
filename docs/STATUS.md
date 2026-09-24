# Status

2026-09-25 (updated) — All artifacts were rebranded off the original
navy/gold palette (Peter: it "screamed corporate/IBM, not construction")
to a construction-coded one: neutral graphite/steel darks and safety
orange, after an interim warm-charcoal attempt was rejected as "looking
like mud." See `docs/DECISIONS.md` for the exact tokens and a real
dark-mode contrast bug this surfaced and fixed.

- **The deck** (`https://claude.ai/artifact/GD94Scrk1hUGMjoFTfND9S`) — the
  only deck. Problem slide's four points sit in an equal 2x2 grid, ending
  on a measured (not alarmist) statement of executive personal liability
  under Korea's safety law. The June 18, 2026 law reference now states
  both of what it actually mandates (foreign-worker safety training *and*
  a general site-wide electronic attendance-tracking requirement). Demo
  slide's status row lists Reporting app / Management dashboard / Training
  app, all "working prototype." Solution slide's 4-output diagram had a
  real CSS bug (a leftover `position: relative` from the old 3-output
  version) fixed, plus bigger/legible pills and a fixed label-overlap issue.
- **Supervisor & worker mockup**
  (`https://claude.ai/artifact/1BcqqqNseS5SCXSHTjS7Ty`) — full i18n across
  5 languages (Vietnamese default, Uzbek, Chinese, Korean, English); hazard
  reports never name the reporter's language in the UI. The tacky hand
  illustration and "PROTOTYPE" ribbon were removed; the rugged case is
  simpler and more realistic (no toy-like corner bumpers); three real
  hazard photos (scaffold plank, water-break area, B2 corridor) replace
  the last gradient placeholders. The mode toggle stays English regardless
  of app language and no longer overlaps the phone.
- **Management dashboard** (`https://claude.ai/artifact/W7QuAyMGnjkjT1CZbXudum`)
  — Warning Labels is now a real generator (9 reports × 4 languages,
  regenerates live), with a quantity stepper and order confirmation. Added
  a "Corrective action" field to the report modal (closes a governance-
  coverage gap: the Safety & Health Manager's incident-investigation duty
  had no UI). Added an English/Korean toggle for the dashboard's own
  interface chrome, backed by an inline translations object.
- **Knowledge & sources** (`https://claude.ai/artifact/CnfwLoVuvfeqDGvePKhKqJ`)
  and **Governance model** (`https://claude.ai/artifact/VZEtVvrA6tYLZsiB2baQ81`)
  — the June 18, 2026 OSH Act amendment is now independently confirmed
  (previously only the vaguer "Sept 22" framing existed); added cultural/
  structural context on Korea's 원청/하청 subcontracting chain and E-9 visa
  dependency. Governance model lives under the same Knowledge nav group as
  a second item, not a separate group.
- **Navigation**: the floating "Prototypes" button on every artifact is now
  "Navigation," always listing the deck first, then the three prototypes,
  then Knowledge and Governance, then the demo index link.

All artifacts are private (Management dashboard is the one exception,
shared "anyone with the link"). The static `site/` export has been
re-synced to match everything above.

See `docs/HANDOFF.md` for gaps, open questions, and what a fresh session
needs to know. See `docs/DECISIONS.md` for why things are built the way
they are, and `docs/RESEARCH.md` / `docs/GOVERNANCE.md` for the underlying
legal/governance research.
