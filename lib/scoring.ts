/** The four judged categories, in the order judges move through them. */
export const CATEGORIES = [
  { key: "theme", label: "Theme" },
  { key: "writing", label: "Writing" },
  { key: "voice", label: "Voice" },
  { key: "structure", label: "Structure" },
] as const;

export type Category = (typeof CATEGORIES)[number]["key"];
export type Scores = Record<Category, number>;

export const MAX_PER_CATEGORY = 20;
export const MAX_TOTAL = MAX_PER_CATEGORY * CATEGORIES.length;

/** A whole number from 0 to 20, or null when the text isn't one. */
export function parseScore(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isInteger(n) && n >= 0 && n <= MAX_PER_CATEGORY ? n : null;
}
