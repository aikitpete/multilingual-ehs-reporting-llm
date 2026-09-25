# Shared demo server

`server.js` is a minimal in-memory HTTP store: the AnjeonTok mobile app
POSTs hazard reports to `/reports`, and the management dashboard
(`site/manager.html`) polls `GET /reports` every 3s to show them live.

## Running it for a demo

```bash
cd server
node server.js          # listens on :4001
```

Then expose it publicly so it works on any WiFi (not just this Mac's LAN
— many venue/campus networks isolate clients from each other, which
breaks a plain LAN IP):

```bash
cloudflared tunnel --url http://localhost:4001
```

This prints a random `https://*.trycloudflare.com` URL each time — copy
it into:
- `mobile-app/App.js` → `SERVER_URL`
- `site/manager.html` → `MOBILE_SERVER_URL`
- `site/government.html` → `GOV_SERVER_URL`

## Testing the critical path

`node server/e2e-test.js` spins up its own throwaway copy of the server
(a different port, never the one used for a live demo), posts a sample
hazard report through it exactly as the mobile app would, and asserts:
GET /reports includes it, a location/category tally over the response
matches what the dashboards compute, and the training-materials
upsert-by-reportId endpoint works. Run it after any change to
`server.js`, the report payload shape, or the dashboards' polling logic.

**Shut both down after the demo** — `pkill -f "node server.js"` and
`pkill -f cloudflared` (or just close the terminal tabs). Nothing here is
meant to run standing; it's throwaway for the pitch.
