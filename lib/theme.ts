/**
 * Centralized color palette.
 *
 * Every color used across the site previously existed as a raw hex literal
 * repeated inline in `style={{ ... }}` objects (752 occurrences across 15
 * files). That made a single brand-color change require a find-and-replace
 * sweep with no compiler safety net against typos. This module is the single
 * source of truth: change a value here and it updates everywhere it's used.
 */
/**
 * Dark-mode notes:
 *
 * `black` and the green brand scale below are intentionally left as raw
 * hex — they're used for permanently-dark chrome (navbar/footer) and
 * saturated brand accents that already read fine on both a cream and a
 * forest-charcoal background, so they don't need to shift with the theme.
 *
 * Every other token (white, the gray/red/amber/yellow/violet/emerald
 * scales) is a CSS custom property (`--token-*`) instead of a flat hex
 * value. The light-mode value of each var lives in `:root` in
 * `app/globals.css` and is identical to what it used to be, so light mode
 * is unchanged. Each one is overridden again inside `.dark` with a
 * dark-safe equivalent, so every component that imports `colors` picks up
 * dark mode automatically — no per-component edits required.
 */
export const colors = {
  black: "#000000",
  // Pure white — used for text/icons sitting on saturated color (green
  // buttons, hero overlays, the always-dark navbar). Stays white in both
  // themes since those surfaces don't change.
  white: "#ffffff",
  // Card/panel surface — used as a *background*. This is the one that
  // needs to flip from white paper to a dark forest-charcoal card in
  // dark mode.
  surface: "var(--token-white)",
  // Navbar/footer chrome background. Stays pure black in light mode
  // (unchanged), but in dark mode becomes a distinct dark surface so the
  // navbar doesn't feel like an unrelated pure-black bar sitting on top
  // of the forest-green page background.
  chrome: "var(--token-chrome)",

  // Soft "chip" surface used for pills/badges/status tags (category
  // badges, filter buttons, callouts). Was `green50`/`green100` +
  // `green600`/`green700` + `green200` border, hardcoded — those looked
  // fine in light mode but stayed pale/cream in dark mode with dark-green
  // text, which is unreadable. These three replace that trio and flip
  // together in dark mode.
  badgeBg: "var(--token-badgeBg)",
  badgeBgStrong: "var(--token-badgeBgStrong)",
  badgeText: "var(--token-badgeText)",
  badgeBorder: "var(--token-badgeBorder)",

  // Heading/label text sitting on a card or page surface (was a flat
  // `green900`, which is a very dark green — fine on a light card, but
  // reads as "dark green on dark green" once the card is dark). Keep
  // `green900` itself for solid brand-green *backgrounds* (buttons,
  // filled badges), which don't need to change.
  heading: "var(--token-heading)",

  // Warm editorial paper tones — replaces the flat black/white chrome
  // with a cream backdrop, closer to a print publication than a webapp.
  paper: "#faf7f0",
  paperDark: "#f3ecda",
  cream100: "#efe6d0",
  cream200: "#e4d7b8",

  // Deepened editorial palette — richer/warmer than the original scale,
  // used for the redesign pass (headlines, cards, the masthead).
  ink: "#0f2818",
  leaf: "#1b5e3a",
  moss: "#5a7a68",
  parchment: "#f2efe6",
  ember: "#c4622d",
  emberLight: "#f0d9c9",

  // Primary brand green scale
  green50: "#f0fdf4",
  green100: "#dcfce7",
  green200: "#bbf7d0",
  green300: "#86efac",
  green400: "#4ade80",
  green600: "#16a34a",
  green700: "#15803d",
  green800: "#166534",
  green900: "#14532d",
  green950: "#0b3319",

  emerald100: "var(--token-emerald100)",

  // Neutral / gray scale
  gray50: "var(--token-gray50)",
  gray100: "var(--token-gray100)",
  gray200: "var(--token-gray200)",
  gray300: "var(--token-gray300)",
  gray400: "var(--token-gray400)",
  gray500: "var(--token-gray500)",
  gray600: "var(--token-gray600)",
  gray700: "var(--token-gray700)",
  gray800: "var(--token-gray800)",
  gray900: "var(--token-gray900)",
  neutral50: "var(--token-neutral50)",

  // Status red scale
  red50: "var(--token-red50)",
  red100: "var(--token-red100)",
  red200: "var(--token-red200)",
  red300: "var(--token-red300)",
  red600: "var(--token-red600)",
  red700: "var(--token-red700)",
  red800: "var(--token-red800)",

  // Amber / warning scale
  amber200: "var(--token-amber200)",
  amber600: "var(--token-amber600)",
  amber700: "var(--token-amber700)",
  amber800: "var(--token-amber800)",
  amber900: "var(--token-amber900)",
  amber900Deep: "var(--token-amber900Deep)",

  // Yellow scale
  yellow50: "var(--token-yellow50)",
  yellow100: "var(--token-yellow100)",
  yellow300: "var(--token-yellow300)",
  yellow400: "var(--token-yellow400)",
  yellow600: "var(--token-yellow600)",

  // Violet accent scale
  violet50: "var(--token-violet50)",
  violet200: "var(--token-violet200)",
  violet700: "var(--token-violet700)",
} as const;

export type ColorToken = keyof typeof colors;
