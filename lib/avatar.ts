import { colors } from "@/lib/theme";

/** "Priya Sharma" -> "PS". Falls back to "?" for empty input. */
export function getInitials(name: string): string {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return initials || "?";
}

// A curated set of deep, white-text-friendly tones pulled from the
// existing design system (plus the site's literary "ink/moss/ember"
// palette), so avatars gain variety without introducing off-brand colors.
const AVATAR_PALETTE = [
  colors.green700,
  colors.violet700,
  colors.red700,
  colors.amber800,
  colors.ember,
  colors.moss,
  colors.green900,
  colors.ink,
];

/**
 * djb2 string hash with an avalanche mix pass, so a given name always
 * lands on the same palette index. The extra mixing step matters here —
 * a plain djb2/sum hash clusters badly on short, similarly-structured
 * strings like names (most map to just 2-3 of the 8 colors), which
 * defeats the point of adding variety.
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x45d9f3b);
  hash ^= hash >>> 16;
  return Math.abs(hash);
}

/**
 * Returns a background color for this person's avatar, deterministically
 * chosen from a fixed palette based on their name — so the same person
 * always gets the same color everywhere on the site (comments, Team,
 * Leaderboard, homepage), while different people get visibly different
 * colors instead of everyone sharing one or two flat tones.
 */
export function getAvatarColor(name: string): string {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return colors.gray400;
  return AVATAR_PALETTE[hashString(trimmed) % AVATAR_PALETTE.length];
}
