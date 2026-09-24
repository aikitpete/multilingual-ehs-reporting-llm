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

**Shut both down after the demo** — `pkill -f "node server.js"` and
`pkill -f cloudflared` (or just close the terminal tabs). Nothing here is
meant to run standing; it's throwaway for the pitch.
