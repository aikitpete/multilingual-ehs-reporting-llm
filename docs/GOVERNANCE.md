# Governance model: actors, roles, and obligations

Research conducted 2026-09-25 (web search) into who actually holds legal
and operational responsibility around a foreign-worker hazard-reporting
system in Korea, and what a defensible governance model for AnjeonTok looks
like. Companion to `docs/RESEARCH.md` (regulatory/budget claims) — this
file is about **who does what**, not **what the law/budget says** in the
abstract.

**Intended reuse**: each obligation below is written as an atomic
MUST / MUST NOT / SHOULD / SHOULD NOT / CAN / CANNOT statement with a
`→ system capability` tag, specifically so a later session can turn this
directly into use cases, access-control rules, and feature requirements
without re-deriving the actor model from scratch.

## Modal-verb legend

| Verb | Meaning | Violating it means... |
|---|---|---|
| **MUST** | Legally or product-critically required | Legal exposure or a broken core promise of the product |
| **MUST NOT** | Legally or product-critically forbidden | Same as above, inverted |
| **SHOULD** | Best practice, expected default behavior | Worse outcomes, not automatically unlawful/broken |
| **SHOULD NOT** | Discouraged default behavior | Same as above, inverted |
| **CAN** | Permitted, available, not mandatory | Nothing — it's optional |
| **CANNOT** | Not technically or legally possible/permitted | A boundary the system enforces or the law forbids |

Each line is tagged **[confirmed]** (backed by an independent legal/
regulatory source, see citations), **[product]** (a design decision this
project made, not a legal requirement), or **[assumption]** (a governance
default this doc proposes because no source settles it — flagged as open
for Peter or a future session to confirm or override).

## 1. Foreign Worker (Reporter / Trainee)

The person on-site who spots a hazard and/or receives safety training.

- **MUST** be able to file a hazard report in their own language, without
  needing Korean. *[product]* → Report intake
- **MUST NOT** have their chosen language shown anywhere reports are
  reviewed by others (decided 2026-09-25 — reports no longer name the
  reporter's language in the UI). *[product]* → Access control & privacy
- **SHOULD** report a hazard as soon as it's spotted, with a photo and one
  marked danger area. *[product]* → Report intake
- **SHOULD NOT** be expected to self-classify severity/category with full
  accuracy — the worker proposes, a supervisor confirms. *[product]* →
  Triage & assignment
- **CAN** choose to speak or type a report. *[product]* → Report intake
- **CAN** revisit training content and retake quizzes. *[product]* →
  Training content
- **CANNOT** see another worker's individual reports. *[assumption — not
  yet a confirmed requirement, but the obvious privacy default]* → Access
  control & privacy
- **CANNOT** edit or delete a report once submitted, to preserve an audit
  trail. *[assumption]* → Audit trail
- Legal backstop: when a hazard report also functions as a report of a
  legal violation, the worker is protected as a whistleblower under the
  **Act on the Protection of Public Interest Whistleblowers (PPIW,
  2011)** — employers are barred from retaliatory action, and identity is
  kept confidential. *[confirmed]*

## 2. Site Supervisor

The first-line reviewer who triages incoming reports for one or more
sites. (On a small site, this may be the same person as the Safety & Health
Manager below — see Open Questions.)

- **MUST** log an action (assign, escalate, or resolve) against every
  High-severity report — none may sit untouched. *[assumption — no
  confirmed SLA number exists; flagged for a future requirements pass]* →
  Triage & assignment
- **SHOULD** generate bilingual warning labels for physical hazards found,
  in Korean plus the reporting worker's language. *[product]* → Label
  generation
- **SHOULD NOT** alter the substance of what a worker reported — only add
  operational fields (assignee, status, label). *[assumption — supports
  audit integrity]* → Audit trail
- **CAN** view a report's category, severity, location, photo, and
  description. *[product]* → Report intake
- **CANNOT** access reports from a site they aren't assigned to.
  *[assumption]* → Access control & privacy
- **CANNOT** see which language a worker used to file a report — that
  visibility sits one level up, with the Safety & Health Manager, only
  when generating a label or follow-up material. *[product, 2026-09-25]* →
  Access control & privacy

## 3. Safety & Health Manager (안전보건관리책임자)

The person legally designated to run the site's safety-management system
day to day — a distinct legal role under Korean law, separate from the
business owner.

- **MUST** build and operate the site's safety-management system: the
  people, budget, and process needed to prevent harm. *[confirmed —
  Serious Accidents Punishment Act (SAPA/중대재해처벌법) Art. 4]* →
  Compliance dashboard
- **MUST** investigate any incident and implement recurrence-prevention
  measures. *[confirmed, SAPA Art. 4]* → Compliance dashboard
- **MUST** carry out any improvement/corrective order issued by central or
  local government under relevant law. *[confirmed, SAPA Art. 4]* →
  Compliance dashboard
- **MUST NOT** allow retaliation against a worker for filing a report —
  and must reverse it (reinstatement) if it happens. *[confirmed, PPIW]* →
  Access control & privacy
- **SHOULD** use aggregated hazard-category data to target recurring
  problems by site. *[product]* → Compliance dashboard
- **SHOULD NOT** use report data to evaluate or penalize the individual
  worker who filed it. *[assumption, anti-retaliation default]* → Access
  control & privacy
- **CAN** see a worker's declared language, but only in the specific
  context of generating a label or follow-up material for them —
  originally implemented as a click-to-reveal modal, not shown in the
  default table view. *[product]* → Label generation
- **CANNOT** alter historical report records — corrections must be
  additive (a new entry), not edits to the original. *[assumption]* →
  Audit trail

## 4. Business Owner / Management-in-charge (경영책임자등)

The person with ultimate authority and responsibility for the business —
in practice, the CEO or an equivalent executive. This is who SAPA
criminally prosecutes, not just the company.

- **MUST** secure the safety-management system described in §3 — the
  named legal duty-holder is this role, not the Safety & Health Manager
  who operates it day to day. *[confirmed, SAPA Art. 4/9]*
- **MUST**, per the OSH Act amendment passed by Korea's National Assembly
  on June 18, 2026, ensure every newly hired foreign worker completes
  basic occupational safety/health education (기초안전보건교육) — in
  effect six months after promulgation, with fines up to ₩3,000,000 for
  violation. The same bill mandates electronic card terminals at
  construction sites for foreign-worker attendance tracking. *[confirmed
  — see `docs/RESEARCH.md` §2b]*
- **MUST NOT** treat the existence of a hazard-reporting tool as a
  substitute for the underlying obligations (budget, personnel, corrective
  action). Logging a report is not equivalent to fixing the hazard, and
  under SAPA, only actually meeting the safety-obligation checklist avoids
  liability if a serious accident still occurs. *[confirmed principle,
  SAPA]*
- **SHOULD** review the government-facing aggregate compliance dashboard
  periodically, not only after an incident. *[product]*
- **CAN** delegate day-to-day operation to the Safety & Health Manager
  while retaining ultimate legal liability — delegation of tasks is not
  delegation of the legal duty. *[confirmed principle, SAPA]*
- **CANNOT** avoid personal criminal liability for a serious industrial
  accident by pointing to a monitoring tool's existence if the underlying
  safety obligations were not actually fulfilled. *[confirmed, SAPA]*

### A note on 원청 (primary contractor) vs 하청 (subcontractor)

"Business Owner" above is written as a single role, but on a real Korean
construction site it usually splits in a legally significant way: the
**원청 (primary/general contractor)** holds the site-wide authority and
budget to fix hazards, while the **하청 (subcontractor)** is often the
worker's actual legal employer — and, disproportionately, the employer of
foreign workers. Korean subcontracting law is explicitly framed around
preventing unfair practices arising from this "일방적 지배와 복종관계" (a
one-sided dominance/subordination relationship) between the two — the
power imbalance is the acknowledged premise of the regulation, not just an
observation about culture. High-risk work (height work, confined-space
welding, heavy-material handling) concentrates on 하청 workers, while the
authority to fix root causes sits with the 원청. Even where the 원청 has a
safety-management system on paper, if it doesn't functionally reach a
subcontracted worker at the bottom of the chain, it isn't a real safety
net for that worker. Any real deployment of AnjeonTok needs to be explicit
about which of the two the "Business Owner" and "Safety & Health Manager"
roles refer to on a given site — see Open Questions.

## 5. Government / Regulator (MOEL, KOSHA, labor inspectors)

- **MUST** enforce OSH Act and SAPA obligations, including proactive and
  complaint-driven inspections. *[confirmed, KOSHA's stated mandate]*
- **MUST** keep a whistleblower's identity confidential when a report
  functions as a public-interest disclosure under PPIW. *[confirmed]*
- **CAN** order corrective/improvement measures and audits of a business's
  safety-management system. *[confirmed, mirrors SAPA Art. 4 duty #3]*
- **CAN** (and does) publish multilingual safety material — KOSHA has
  distributed training content in 10, then 16, languages for migrant
  workers. *[confirmed]*
- **SHOULD** use aggregated, anonymized compliance signals (of the kind
  AnjeonTok's government dashboard shows) to target inspections, rather
  than relying only on employer self-reported paperwork. *[product/
  assumption — this is the pitch's core value proposition to government,
  not yet a confirmed government practice]*
- **SHOULD NOT** access individual, worker-identifying report content
  without a defined legal basis (e.g. an active investigation). *[
  assumption — privacy-by-design default]*
- **CANNOT** compel real-time direct database access to a private
  company's internal tool without a defined legal or contractual basis.
  *[assumption — an explicit boundary this governance model proposes,
  not something either confirmed or ruled out by research]*

## 6. AnjeonTok System (the platform / AI itself)

The system's own obligations — written this way specifically so they can
become engineering requirements.

- **MUST** preserve a worker's original report content unedited —
  translation and labeling are additive layers, never replacements. →
  Report intake, Audit trail
- **MUST NOT** auto-resolve or auto-close a High-severity report without a
  human decision. → Triage & assignment
- **MUST NOT** fabricate or embellish translated content beyond what the
  worker actually stated. → Report intake
- **MUST** enforce the per-actor visibility rules in §1–§5 (e.g., language
  hidden from Supervisor, revealed only to Safety & Health Manager
  on-demand). → Access control & privacy
- **SHOULD** flag, not silently drop, any report it cannot classify or
  translate with confidence. → Report intake
- **SHOULD NOT** be treated as the sole system of record for legal
  compliance evidence — see Business Owner's "must not" above. →
  Compliance dashboard
- **CAN** generate multilingual training material derived from resolved
  reports. → Training content
- **CAN** aggregate anonymized statistics for the government dashboard. →
  Compliance dashboard
- **CANNOT** determine legal liability or fault for an incident — that
  stays a human/legal process outside the system. → Compliance dashboard

## System capability map (for later requirements work)

Every "→" tag above lands in one of these seven buckets. A future
requirements/use-case pass can walk this list feature by feature and pull
in every actor obligation tagged with it:

1. **Report intake** — filing, photo-marking, language, description
2. **Triage & assignment** — supervisor review, status, escalation
3. **Label generation** — bilingual warning labels
4. **Training content** — worker-facing learning feed, quizzes
5. **Compliance dashboard** — site/company-level aggregate view
6. **Access control & privacy** — who can see what, including language
7. **Audit trail** — immutability, historical record integrity

## Cultural & structural context (why this is hard in practice)

Two structural realities shape every obligation above, and should inform
any future use-case or requirements work, not just the slide copy:

1. **The 원청/하청 chain diffuses responsibility.** Work instructions,
   safety training, PPE provision, and hazard-information sharing get
   blurred across subcontracting layers. A worker reporting a hazard may
   not know — and the system may not cleanly encode — which company is
   actually accountable for fixing it. Any escalation/assignment feature
   needs to model this chain explicitly, not assume one flat "employer."
2. **E-9 visa dependency makes reporting personally risky for the
   worker.** An E-9 (Employment Permit System) worker can change employers
   only a limited number of times, and a transfer needs the current
   employer's consent or proof of an employer violation — proof that's
   hard to establish given language barriers. Leaving without permission
   makes a worker undocumented. This is a real, not just perceived,
   disincentive to report anything that could be read as making trouble
   for an employer who holds this much leverage over the worker's ability
   to stay in Korea at all. It is the concrete reason §1's "must not show
   the worker's language to a supervisor" rule matters as more than a
   privacy nicety — for this population, minimizing what identifies a
   specific worker to people with power over their visa status is what
   makes a reporting tool usable in the first place, not an optional
   safeguard.

Full detail and sources: `docs/RESEARCH.md` §6.

## Open governance questions (not yet decided — surface to Peter)

- **Role collapse on small sites**: does the Supervisor and Safety & Health
  Manager role collapse into one person under 50 employees (before SAPA's
  wider threshold applied from 2024)? The product currently only models a
  single "Supervisor" persona plus a separate "Management dashboard" —
  worth confirming whether that maps to Supervisor vs. Safety & Health
  Manager, or blurs them.
- **Report SLA**: no confirmed source sets a required response time for a
  High-severity report. The "MUST log an action" rule above is a
  reasonable default, not a legal requirement.
- **Data retention/deletion**: not yet decided. Worker report data,
  including any photo, will eventually need a retention policy (how long
  kept, who can delete, under what legal basis) — currently undefined.
- **Government real-time access**: this doc proposes government gets
  aggregated/anonymized data only, never raw individual reports, absent a
  specific legal basis (e.g. investigation). This is a governance
  proposal, not a confirmed legal requirement — worth validating if the
  product ever pursues a real government pilot.
