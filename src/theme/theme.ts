// Brand palette carried over from the L&C Modeling Academy website
// (base.css / admin.css / blog.css) — magenta→blue gradient as the primary
// accent, gold as a luxury/CTA accent, near-black for editorial dark surfaces.
// Brand accents (primary/secondary/gold/success/danger) are the same in both
// themes — only the neutrals (backgrounds/surfaces/text/border) swap. See
// ThemeContext.tsx for the switch itself; `colors` below is mutated in place
// by that context (never reassigned) so every existing `import { colors }`
// keeps working without every screen needing to move to a hook.
const BRAND = {
  primary: '#8a1f66', // magenta/plum — site accent 1
  primaryLight: '#a8377f',
  secondary: '#3a8dff', // blue — site accent 2
  gold: '#c6a15b', // luxury accent (Get Scouted CTAs, badges)
  goldLight: '#ecd9ae',
  goldDark: '#a8823f',
  success: '#1f8f4e',
  danger: '#d64545',
  dangerDark: '#b23636',
};

export const darkNeutrals = {
  ink: '#0b0b0c',
  ink2: '#1c1c22',
  bg: '#0b0b0c', // near-black canvas — the app's default theme
  surface: '#18181c',
  surfaceAlt: '#222227',
  border: '#3a3226',
  text: '#d9bd85', // gold body text on the dark default, not plain white
  textMuted: 'rgba(217,189,133,0.68)',
  textOnDark: '#d9bd85',
  textOnDarkMuted: 'rgba(217,189,133,0.7)',
};

export const lightNeutrals = {
  ink: '#0b0b0c',
  ink2: '#1c1c22',
  bg: '#faf9f6', // warm off-white canvas
  surface: '#ffffff',
  surfaceAlt: '#f3f1ec',
  border: '#e6e2d8',
  text: '#1a1a1d',
  textMuted: '#6b6a70',
  textOnDark: '#f5f3ee',
  textOnDarkMuted: 'rgba(245,243,238,0.7)',
};

export type ThemeMode = 'dark' | 'light';

// A single mutable object, not a new one per theme — `ThemeContext` calls
// `applyThemeColors()` to overwrite these properties in place on toggle, so
// every file that already did `import { colors } from '.../theme'` (the
// entire app) reads the live palette without switching to a hook.
export const colors: typeof BRAND & typeof darkNeutrals = { ...BRAND, ...darkNeutrals };

export function applyThemeColors(mode: ThemeMode) {
  Object.assign(colors, mode === 'dark' ? darkNeutrals : lightNeutrals);
}

// Web-only synchronous bootstrap. AsyncStorage (used everywhere else, see
// ThemeContext.tsx) can't be read before the rest of this module — and
// every screen's own StyleSheet.create — finishes evaluating, so a runtime
// toggle can only safely update a handful of shared components (nav bars,
// inputs, buttons) rather than every screen's frozen colors. localStorage,
// on web, IS synchronous: reading it here, before `typography` below is
// built, means a full page reload after toggling (see ThemeContext.tsx)
// genuinely re-themes everything, including colors baked into every
// screen's own styles. Native has no synchronous equivalent without a new
// native module, so it keeps the narrower, always-safe reactive scope.
try {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('lc-theme-mode');
    if (saved === 'light') applyThemeColors('light');
  }
} catch {
  // ignore — storage can be unavailable (private browsing, SSR, etc.)
}

export const gradients = {
  brand: [colors.primary, colors.secondary] as const,
  gold: [colors.goldLight, colors.gold, colors.goldDark] as const,
  dark: ['#0b0b0c', '#1c1c22'] as const,
};

export const fonts = {
  heading: 'PlayfairDisplay_700Bold',
  headingItalic: 'PlayfairDisplay_600SemiBold_Italic',
  wordmark: 'PlayfairDisplay_800ExtraBold',
  body: 'Outfit_400Regular',
  bodyMedium: 'Outfit_500Medium',
  bodySemiBold: 'Outfit_600SemiBold',
  bodyBold: 'Outfit_700Bold',
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
};

// Shared type scale — every plain (non-hero) screen title, dialog/gate
// title, and intro paragraph pulls from here so the same "level" of text
// reads at the same size and weight everywhere in the app, instead of each
// screen picking its own nearby-but-different number. Hero titles set over
// photo banners (Home/Models/Connect/Blog) are a distinct, larger display
// style and intentionally not part of this scale.
//
// pageTitle/sectionTitle deliberately mirror the real website's own
// "section h2" treatment (see base.css: `section h2 { text-align: center;
// text-transform: uppercase; }`) — centered, uppercase, letter-spaced —
// rather than the app's earlier left-aligned sentence-case titles, so
// screens read as the same editorial style as lcmodelingschool.com.
export const typography = {
  // Top-of-screen H1 (e.g. "My Bookings", "Notifications", "Earnings")
  pageTitle: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.text,
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
  },
  // Sub-section H2 within a page — see also Card.tsx's <SectionTitle>
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.text,
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  // Smaller heading used in gates/empty-states/modals ("Sign in to book")
  dialogTitle: { fontFamily: fonts.heading, fontSize: 19, color: colors.text, textAlign: 'center' as const },
  // One-line descriptive paragraph directly under a pageTitle
  intro: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
} as const;
