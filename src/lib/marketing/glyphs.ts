/**
 * Short decorative marks for subject, exam and country tiles and hero cards.
 * Purely visual (always aria-hidden), so they can be playful; keep them to a
 * few characters so they fit the tile.
 */
const GLYPHS: Record<string, string> = {
  // Subjects
  maths: "×÷",
  english: "Aa",
  science: "?!",
  biology: "DNA",
  chemistry: "H₂O",
  physics: "F=ma",
  "reading-and-creative-writing": "Abc",
  "public-speaking": "Hi!",
  "further-maths": "∑",
  calculus: "∫",
  statistics: "σ",
  "computer-science": "</>",
  french: "Fr",
  spanish: "Es",
  economics: "£€",
  "english-literature": "Lit",
  // Exams (subject page slugs and exam ids)
  "11-plus": "11+",
  "sat-act": "SAT",
  gcse: "GCSE",
  "a-level": "A*",
  "ks2-sats": "KS2",
  "common-entrance": "CE",
  "national-5-highers": "N5",
  "ssat-isee": "SSAT",
  "ap-exams": "AP",
  shsat: "NYC",
  "gifted-and-talented": "G&T",
  "eqao-osslt": "EQAO",
  "alberta-pats-diplomas": "AB",
  ib: "IB",
  // Countries (country page slugs and exam country ids)
  uk: "UK",
  usa: "US",
  us: "US",
  canada: "CA",
  international: "Intl",
};

/** The mark for a slug or id, falling back to the first letters of `name`. */
export function glyphFor(key: string, name = key): string {
  return GLYPHS[key] ?? name.replace(/[^A-Za-z0-9+]/g, "").slice(0, 3);
}
