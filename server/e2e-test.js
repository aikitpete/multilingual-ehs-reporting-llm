// End-to-end test for the critical path: mobile app submits a hazard
// report -> shared server stores it -> management/government dashboards
// (which just poll the same GET endpoints) would show it correctly.
//
// Runs its own throwaway server instance on a scratch port so it never
// touches the server used for an actual live demo. No test framework,
// no new dependency -- Node's built-in http/assert/fetch cover this.
//
// Usage: node server/e2e-test.js
'use strict';

const assert = require('assert');
const { spawn } = require('child_process');
const path = require('path');

const PORT = 4099;
const BASE = `http://localhost:${PORT}`;

function tally(items, key) {
  const counts = {};
  for (const item of items) counts[item[key]] = (counts[item[key]] || 0) + 1;
  return counts;
}

async function waitForServer(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/reports`);
      if (res.ok) return;
    } catch (e) { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('server did not start in time');
}

async function run() {
  const steps = [];
  const ok = (name) => steps.push({ name, pass: true });
  const check = (name, cond) => { assert.ok(cond, name); ok(name); };

  // 1. Baseline: server starts empty.
  const before = await (await fetch(`${BASE}/reports`)).json();
  check('server starts with an empty report list', Array.isArray(before) && before.length === 0);

  // 2. Submit a hazard report exactly as the mobile app does (see
  // mobile-app/App.js postReportToServer / submitReport).
  const sample = {
    category: 'electrical',
    categoryLabel: 'Điện',
    severity: 'high',
    severityLabel: 'Cao',
    location: 'B1 storage',
    note: 'day dien bi lo, gan nuoc',
    lang: 'vi',
    langLabel: 'Tiếng Việt',
  };
  const postRes = await fetch(`${BASE}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sample),
  });
  check('POST /reports returns 201', postRes.status === 201);
  const posted = await postRes.json();
  check('posted report gets a server-assigned id', typeof posted.id === 'string' && posted.id.length > 0);
  check('posted report gets a receivedAt timestamp', typeof posted.receivedAt === 'string');

  // 3. The dashboards' poll: GET /reports must include it, most-recent first.
  const afterList = await (await fetch(`${BASE}/reports`)).json();
  check('GET /reports now has exactly one report', afterList.length === 1);
  check('the report in the list matches what was posted', afterList[0].id === posted.id
    && afterList[0].category === sample.category
    && afterList[0].location === sample.location);

  // 4. Governance: the worker's reporting language must never be required
  // to render the dashboards' general aggregates -- it's carried as data,
  // but a location/category tally (what manager.html's renderLocationBreakdown
  // and the site report actually compute) must not need it.
  const byLocation = tally(afterList, 'location');
  const byCategory = tally(afterList, 'category');
  check('location tally reflects the new report', byLocation['B1 storage'] === 1);
  check('category tally reflects the new report', byCategory['electrical'] === 1);

  // 5. Government dashboard's aggregate count is just list.length -- confirm
  // the shape supports that directly (see site/government.html pollGovReportCount).
  check('report count usable as a plain aggregate number', typeof afterList.length === 'number' && afterList.length === 1);

  // 6. Submit a second report at the same location -- this is the
  // pattern the pitch's "repeat hotspot" story depends on.
  await fetch(`${BASE}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...sample, category: 'fire', categoryLabel: 'Cháy', note: '' }),
  });
  const afterSecond = await (await fetch(`${BASE}/reports`)).json();
  const byLocation2 = tally(afterSecond, 'location');
  check('a second report at the same location produces a repeat-location count of 2', byLocation2['B1 storage'] === 2);

  // 7. Training materials: dashboard generates one per report and syncs it
  // by reportId; posting again for the same reportId must upsert, not duplicate.
  const material = { reportId: posted.id, titleEn: 'Electrical hazard', quiz: { q: 'test?', correct: 'a', wrong: 'b' } };
  await fetch(`${BASE}/training-materials`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(material),
  });
  await fetch(`${BASE}/training-materials`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...material, titleEn: 'Electrical hazard (regenerated)' }),
  });
  const materials = await (await fetch(`${BASE}/training-materials`)).json();
  check('training-materials POST upserts by reportId, not duplicates', materials.filter((m) => m.reportId === posted.id).length === 1);
  check('the regenerated content replaced the original', materials.find((m) => m.reportId === posted.id).titleEn === 'Electrical hazard (regenerated)');

  // 8. Mobile app's own Training screen polls this same endpoint -- confirm
  // it's readable with no auth/extra params, matching App.js's fetch call.
  check('training-materials list is directly usable by the mobile app', Array.isArray(materials));

  return steps;
}

async function main() {
  const server = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'pipe',
  });
  server.on('error', (e) => { console.error('failed to start server:', e); process.exit(1); });

  try {
    await waitForServer(5000);
    const steps = await run();
    console.log(`\n✓ ${steps.length} checks passed — critical path (report → dashboards' data) is intact.\n`);
    process.exitCode = 0;
  } catch (err) {
    console.error(`\n✗ FAILED: ${err.message}\n`);
    process.exitCode = 1;
  } finally {
    server.kill();
  }
}

main();
