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
