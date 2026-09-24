// Minimal shared store for the hackathon demo: the AnjeonTok mobile app
// POSTs hazard reports here, and the management dashboard polls GET
// /reports to display them. In-memory only — restarting the process
// clears it, which is fine for a live demo.
const http = require('http');

const PORT = process.env.PORT || 4001;
const reports = [];

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  send(res, 404, { error: 'not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`AnjeonTok shared report store listening on :${PORT}`);
});
