import vi from './vi.json';
import uz from './uz.json';
import zh from './zh.json';
import ko from './ko.json';
import en from './en.json';

// To add a language: drop a new <code>.json here (copy en.json's keys),
// import it above, and add it to this map in the order it should appear
// in the picker. Any key it's missing falls back to English automatically
// — no other code changes needed.
export const LANGUAGES = { vi, uz, zh, ko, en };
export const LANGUAGE_CODES = Object.keys(LANGUAGES);

export function t(langCode, key) {
  const lang = LANGUAGES[langCode] || LANGUAGES.en;
  return lang[key] ?? LANGUAGES.en[key] ?? key;
}
