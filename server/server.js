// Minimal shared store for the hackathon demo: the AnjeonTok mobile app
// POSTs hazard reports here, and the management dashboard polls GET
// /reports to display them. In-memory only — restarting the process
// clears it, which is fine for a live demo.
const http = require('http');

const PORT = process.env.PORT || 4001;
const reports = [];
const trainingMaterials = [];

// Real LLM call when an API key is configured; otherwise (or on any
// failure/timeout) falls back to `fallback: true` with no feedback text,
// and the app shows its own localized "looks good" message. Never throws,
// never blocks — the worker-report flow must not stall on this.
const AI_TIMEOUT_MS = 4500;

async function getAiFeedback({ note, category, severity, location, lang }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !note || !note.trim()) {
    return { ok: true, feedback: null, fallback: true };
  }

  const prompt = [
    'You are a construction-site safety assistant helping a worker improve a hazard report before it is sent to their safety manager.',
    `The worker's report: category=${category || 'unspecified'}, severity=${severity || 'unspecified'}, location=${location || 'unspecified'}.`,
    `Worker's own description: "${note}"`,
    `Reply in this language: ${lang || 'en'}.`,
    'If the description is missing an important detail (exact spot, what makes it dangerous, who is at risk), give ONE short, specific, actionable tip to improve it — under 20 words, plain language, no preamble.',
    'If the description is already clear and specific enough to act on, reply with a short encouraging confirmation instead (e.g. "Looks good — this is clear enough to send.").',
    'Reply with ONLY that one sentence. Do not repeat the input. Do not add a greeting or sign-off.',
  ].join('\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });
    if (!res.ok) return { ok: true, feedback: null, fallback: true };
    const data = await res.json();
    const text = data && data.content && data.content[0] && data.content[0].text;
    if (!text) return { ok: true, feedback: null, fallback: true };
    return { ok: true, feedback: text.trim(), fallback: false };
  } catch (e) {
    return { ok: true, feedback: null, fallback: true };
  } finally {
    clearTimeout(timer);
  }
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, bypass-tunnel-reminder',
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});

  if (req.url === '/reports' && req.method === 'GET') {
    return send(res, 200, reports);
  }

  if (req.url === '/reports' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      let data;
      try {
        data = JSON.parse(body);
      } catch (e) {
        return send(res, 400, { error: 'invalid json' });
      }
      const report = { ...data, id: 'r' + Date.now(), receivedAt: new Date().toISOString() };
      reports.unshift(report);
      console.log('New report:', report.categoryLabel, report.severityLabel, '(' + report.lang + ')');
      send(res, 201, report);
    });
    return;
  }

  if (req.url === '/ai-feedback' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      let data;
      try {
        data = JSON.parse(body);
      } catch (e) {
        return send(res, 400, { error: 'invalid json' });
      }
      const feedback = await getAiFeedback(data);
      send(res, 200, feedback);
    });
    return;
  }

  // Dev-only convenience: wipes mobile-submitted reports/materials so a
  // presenter can reset the demo data. Never surfaced in the app UI; only
  // the discrete dashboard control below calls this.
  if (req.url === '/reports' && req.method === 'DELETE') {
    reports.length = 0;
    trainingMaterials.length = 0;
    console.log('Reports and training materials cleared (dev reset).');
    return send(res, 200, { ok: true });
  }

  if (req.url === '/training-materials' && req.method === 'GET') {
    return send(res, 200, trainingMaterials);
  }

  if (req.url === '/training-materials' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      let data;
      try {
        data = JSON.parse(body);
      } catch (e) {
        return send(res, 400, { error: 'invalid json' });
      }
      // Upsert by reportId: the dashboard regenerates a card in place,
      // it doesn't create a new one each time.
      const idx = trainingMaterials.findIndex((m) => m.reportId === data.reportId);
      const material = { ...data, updatedAt: new Date().toISOString() };
      if (idx >= 0) trainingMaterials[idx] = material; else trainingMaterials.unshift(material);
      console.log('Training material synced:', material.reportId, material.titleEn);
      send(res, 201, material);
    });
    return;
  }

  send(res, 404, { error: 'not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`AnjeonTok shared report store listening on :${PORT}`);
});
