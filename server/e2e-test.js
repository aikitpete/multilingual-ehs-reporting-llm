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
const DEMO_SCENARIOS = require('../mobile-app/src/data/demoScenarios');
const EN_STRINGS = require('../mobile-app/src/i18n/en.json');

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

  // 9. "Demo data" quick-fill (App.js loadDemoScenario): pre-fills the
  // exact same draft fields a manual entry would set, then goes through
  // the identical submitReport() -> postReportToServer() call. This
  // reconstructs that real payload for two of the three presets and
  // submits them exactly as the app does -- no separate demo backend path.
  function payloadForScenario(scenario, note) {
    return {
      category: scenario.category,
      categoryLabel: EN_STRINGS[`report.category.${scenario.category}`],
      severity: scenario.severity,
      severityLabel: EN_STRINGS[`report.severity.${scenario.severity}`],
      location: scenario.location,
      note: note !== undefined ? note : scenario.note,
      lang: 'en',
      langLabel: EN_STRINGS['lang.name'],
    };
  }

  const fall = DEMO_SCENARIOS.find((s) => s.id === 'fall');
  const cableWater = DEMO_SCENARIOS.find((s) => s.id === 'cable_water');
  check('demo fixtures include the fall and cable+water scenarios', !!fall && !!cableWater);

  const fallRes = await fetch(`${BASE}/reports`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadForScenario(fall)),
  });
  const fallPosted = await fallRes.json();
  check('demo scenario 1 (fall) submits through the real endpoint', fallRes.status === 201);
  check('demo scenario 1 keeps the worker description in English, unmodified', fallPosted.note === fall.note);
  check('demo scenario 1 maps to the existing taxonomy (falls/high/4F east stairwell)',
    fallPosted.category === 'falls' && fallPosted.severity === 'high' && fallPosted.location === '4F east stairwell');

  const cableRes = await fetch(`${BASE}/reports`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadForScenario(cableWater)),
  });
  const cablePosted = await cableRes.json();
  check('demo scenario 2 (cable+water) submits through the real endpoint', cableRes.status === 201);
  check('demo scenario 2 maps to the existing taxonomy (electrical/high/B2 corridor)',
    cablePosted.category === 'electrical' && cablePosted.severity === 'high' && cablePosted.location === 'B2 corridor');

  // 10. Both prior test reports plus both demo submissions must now be
  // present, accumulated (not replaced) -- this is what "manager dashboard
  // updated exactly once per upload" and "government count accumulates"
  // actually reduce to at the data layer.
  const afterDemo = await (await fetch(`${BASE}/reports`)).json();
  check('all four reports are present after two demo submissions (no drops, no dupes)', afterDemo.length === 4);
  check('demo scenario ids are each represented exactly once',
    afterDemo.filter((r) => r.id === fallPosted.id).length === 1 && afterDemo.filter((r) => r.id === cablePosted.id).length === 1);

  // 11. Persistence: a second, independent GET (simulating a dashboard
  // reload/revisit) must return the same data, not a stale or partial view.
  const reread = await (await fetch(`${BASE}/reports`)).json();
  check('re-fetching (simulated reload) returns the same accumulated set', reread.length === afterDemo.length
    && reread.some((r) => r.id === fallPosted.id) && reread.some((r) => r.id === cablePosted.id));

  // 12. Training material generated for each new report, keyed by its real
  // report id -- mirrors the dashboard's per-report generation, asserting
  // structure/presence rather than exact generated prose.
  for (const posted_ of [fallPosted, cablePosted]) {
    await fetch(`${BASE}/training-materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: posted_.id, titleEn: `${posted_.categoryLabel} hazard`, quiz: { q: 'q', correct: 'a', wrong: 'b' } }),
    });
  }
  const materialsAfterDemo = await (await fetch(`${BASE}/training-materials`)).json();
  check('training material exists for the fall scenario report', materialsAfterDemo.some((m) => m.reportId === fallPosted.id && m.titleEn.length > 0));
  check('training material exists for the cable+water scenario report', materialsAfterDemo.some((m) => m.reportId === cablePosted.id && m.titleEn.length > 0));

  // 13. AI feedback endpoint: with no ANTHROPIC_API_KEY configured (the
  // default/test environment), must resolve fast and safely -- never a
  // 500, never a hang -- since the mobile UI's Submit must never be
  // blocked by this. This is the exact contract getAiFeedback() promises.
  const aiRes = await fetch(`${BASE}/ai-feedback`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note: fall.note, category: 'Fall', severity: 'High', location: fall.location, lang: 'en' }),
  });
  const aiBody = await aiRes.json();
  check('ai-feedback responds 200 even with no API key configured', aiRes.status === 200);
  check('ai-feedback response is always the safe-fallback shape when no key is set', aiBody.ok === true && aiBody.fallback === true && aiBody.feedback === null);

  const aiEmptyRes = await fetch(`${BASE}/ai-feedback`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: '' }),
  });
  check('ai-feedback handles an empty note without erroring', aiEmptyRes.status === 200);

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
