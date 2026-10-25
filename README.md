# AnjeonTok (안전톡)

Multilingual hazard reporting for construction sites. A worker reports a hazard in their own language. The system turns it into one structured record and routes that record to the people who need it: a site report in the supervisor's language, warning signs, training material, and aggregate compliance data.

Built as a prototype for Korean construction sites, where a large share of the workforce does not read Korean. The design doesn't depend on the market. Swap the target language and the signage table and the same pipeline applies anywhere a crew and its supervisors do not share a language.

**Pitch deck:** https://anjeontok.netlify.app
**Authors:** Peter Gerhat, Calvin Milliken, Aron Berger
**Contact:** [LinkedIn](https://www.linkedin.com/in/aikitpete) · [petegerhat.com](https://www.petegerhat.com)

## The problem

A worker can see a hazard and still not report it, because reporting means writing in a language they don't use. The supervisor who receives reports in five languages, or none, has no reliable way to triage them. Regulators, meanwhile, increasingly expect multilingual safety material, documented training and traceable corrective actions.

In 2025, 286 construction workers died in investigated workplace accidents in Korea (Ministry of Employment and Labor). Sources for every figure on the deck are in [`docs/RESEARCH.md`](docs/RESEARCH.md).

## What it does

1. The worker picks a language once, then reports by voice or text, with a photo and one marked danger area.
2. A model translates and structures the report against a fixed schema.
3. One record fans out to four outputs:

| Output | Audience | Notes |
|---|---|---|
| Site safety report | Supervisor, safety manager | Review, assign an owner, log the corrective action |
| Warning sign | The site | Local language plus the worker's language, printed |
| Training card | The crew | Photo, translated caption, short quiz, back into the same app |
| Compliance report | Government, legal | Aggregate counts and trends only |

## Design decisions worth reading

- **The fork is the point.** The worker's language and identity are stripped before the record reaches the supervisor table or the government view. Access is restricted by the API, not by hiding a column in the UI.
- **The model doesn't write the sign.** Signal words and hazard names (위험, 추락) come from a fixed signage table. The model only fills the free-text fields, so a printed sign always reads like a real sign.
- **Structured output, not prose.** The translation step returns JSON against a schema, with a `needs_review` flag. Anything unclear goes to a person before a sign or translation is used.
- **The original is kept.** The worker's own words are stored unedited, so the translation is never the only version on record.
- **Governance first.** Six actors (worker, supervisor, safety manager, business owner, government, the system itself), each with MUST / SHOULD / CAN obligations mapped to a system capability. See [`docs/GOVERNANCE.md`](docs/GOVERNANCE.md).

## What is real and what is not

This is a concept prototype, not a product. We've kept the table below honest about what runs and what doesn't.

| Part | State |
|---|---|
| Mobile app (Expo / React Native) | Runs. Five languages, report flow, training tab. Posts to the demo server. |
| Demo server (`server/`) | Runs. In-memory store, no auth, no persistence. One real model call (`/ai-feedback`). |
| Management and government dashboards | Static pages that poll the demo server. Report generation is simulated. |
| Translation and structuring pipeline | **Design only.** Documented with an example prompt and output. Not running code. |
| Multi-tenant access control, audit trail | Specified in the governance model. We haven't built it. |

[`site/backend.html`](site/backend.html) marks each step as running today or proposed.

## Repo layout

```
mobile-app/   Expo app: reporting, training, i18n (en, ko, vi, uz, zh)
server/       Minimal Node demo server and an end-to-end test
site/         Pitch deck and prototype pages (deployed to Netlify)
reports/      Sample PDF reports (source HTML plus PDF)
docs/         Research, governance model, decisions log, status
netlify/      Edge function that handles login for the non-public pages
```

## Run it locally

```bash
# demo server (port 4001)
node server/server.js
node server/e2e-test.js        # critical-path test, starts its own throwaway server

# mobile app
cd mobile-app && npm install && npx expo start

# static pages
python3 -m http.server -d site 8000
```

Set `ANTHROPIC_API_KEY` before starting the server if you want the real model call. Without it the endpoint falls back to canned output.

To point the app and dashboards at your own server, set `SERVER_URL` in `mobile-app/App.js`, `MOBILE_SERVER_URL` in `site/manager.html` and `GOV_SERVER_URL` in `site/government.html`.

## Hosting and access

`site/` deploys to Netlify on every push to `master`. `netlify.toml` sets the publish directory, so there is no build step. The pitch deck is public. The prototypes and internal pages sit behind a login, handled by [`netlify/edge-functions/auth.ts`](netlify/edge-functions/auth.ts): session cookie, two roles, default-deny for any path not listed. If you'd like to see the prototypes, get in touch and we'll set you up with a login.

## Documentation

| File | Contents |
|---|---|
| [`docs/RESEARCH.md`](docs/RESEARCH.md) | Regulatory and budget claims, each checked against a source |
| [`docs/GOVERNANCE.md`](docs/GOVERNANCE.md) | Actors, obligations, capability map, open questions |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Dated log of non-obvious calls and the reasons |
| [`docs/STATUS.md`](docs/STATUS.md) | What changed most recently |

## Licence

[PolyForm Strict 1.0.0](LICENSE): source-available, noncommercial, no changes or redistribution. [`NOTICE`](NOTICE) adds permission to read, clone and run the code locally to evaluate the work, and covers names, third-party material and model training. The Expo template files under `mobile-app/` keep their own MIT licence. Anything else needs written permission.
