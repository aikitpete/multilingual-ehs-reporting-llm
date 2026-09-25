// Real jobsite photos, one per hazard category (falls/electrical/heat
// reused from the deck; fire/chemical supplied separately). No photo for
// "other" — falls back to the plain icon+color card.
export const CATEGORY_PHOTO = {
  falls: require('../../assets/hazards/falls.jpg'),
  electrical: require('../../assets/hazards/electrical.jpg'),
  fire: require('../../assets/hazards/fire.webp'),
  heat: require('../../assets/hazards/heat.jpg'),
  chemical: require('../../assets/hazards/chemical.webp'),
};

// Seed hazard reports so the Training tab has real content to demo
// before the user submits their own report. A submitted report is
// prepended to this same list at runtime.
export const SEED_REPORTS = [
  { id: 's1', category: 'electrical', severity: 'high', color: '#C97A1F', icon: '⚡' },
  { id: 's2', category: 'falls', severity: 'high', color: '#C2402A', icon: '🪜' },
  { id: 's3', category: 'heat', severity: 'medium', color: '#3D7A34', icon: '🌡️' },
];

export const CATEGORIES = ['falls', 'electrical', 'fire', 'heat', 'chemical', 'other'];
export const CATEGORY_ICON = {
  falls: '🪜',
  electrical: '⚡',
  fire: '🔥',
  heat: '🌡️',
  chemical: '☣️',
  other: '❓',
};
export const QUIZ_CATEGORIES = ['falls', 'electrical', 'fire', 'heat'];

// Matches the seed reports' real locations (site/manager.html), so a live
// demo submission lands among them rather than in a made-up place. B1
// storage is the default on purpose: it's already the site with the most
// repeat reports in the seed data (wiring + gas cylinder, called out in
// the AI analysis as "3rd storage-area report this quarter") — submitting
// there live makes the pattern-detection story land during a demo.
export const LOCATIONS = [
  'B1 storage',
  '4F east stairwell',
  '2F corridor',
  'Roof, north',
  'Yard, zone C',
  'B2 corridor',
  '3F, unit 12',
  'Yard, zone A',
];
export const DEFAULT_LOCATION = LOCATIONS[0];
