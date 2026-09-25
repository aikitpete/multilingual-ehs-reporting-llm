// Presenter-only "Demo data" fixtures for the hackathon pitch. These only
// pre-fill the worker-report form inputs -- selecting one still goes
// through the exact same submitReport() -> POST /reports pipeline as a
// manually-typed report. Shared with server/e2e-test.js so the test
// asserts against the same payloads the demo button actually sends.
//
// category/location values are drawn from the app's existing taxonomy
// (seedReports.js) -- deliberately not inventing new ones, per the
// scenario spec's own "map to closest existing valid value" instruction.
const DEMO_SCENARIOS = [
  {
    id: 'fall',
    label: 'Fall hazard — 4F stairwell',
    category: 'falls',
    severity: 'high',
    location: '4F east stairwell',
    note: 'There is an opening near the stairs on the 4th floor and there is no barrier. A cart just went very close to it. Someone walking past without noticing could fall. I am working, so I quickly took a photo to report it.',
  },
  {
    id: 'cable_water',
    label: 'Cable + water — B2 corridor',
    category: 'electrical',
    severity: 'high',
    location: 'B2 corridor',
    note: 'A cable is lying across the floor in the B2 corridor and there is water there too. A lot of people walk through here. My foot almost caught on it just now. The temporary electrical panel is also nearby.',
  },
  {
    id: 'gas_cylinder',
    label: 'Gas cylinder — storage entrance',
    category: 'fire',
    severity: 'high',
    location: 'B1 storage',
    note: 'This large cylinder by the storage entrance is lying down. There are cardboard boxes and wooden boards next to it, and it is not secured. Forklifts keep passing here and one nearly hit it just now. I took a photo to report it.',
  },
];

module.exports = DEMO_SCENARIOS;
