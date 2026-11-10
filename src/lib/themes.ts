import {defineTheme, type DefinedTheme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral';
import {butterTheme} from '@astryxdesign/theme-butter';
import {chocolateTheme} from '@astryxdesign/theme-chocolate';
import {matchaTheme} from '@astryxdesign/theme-matcha';
import {stoneTheme} from '@astryxdesign/theme-stone';
import {gothicTheme} from '@astryxdesign/theme-gothic';
import {y2kTheme} from '@astryxdesign/theme-y2k';

// The 7 ready-made Astryx themes. Every user theme starts from one of these.
export const PRESETS = {
  neutral: {label: 'Neutral', theme: neutralTheme},
  butter: {label: 'Butter', theme: butterTheme},
  chocolate: {label: 'Chocolate', theme: chocolateTheme},
  matcha: {label: 'Matcha', theme: matchaTheme},
  stone: {label: 'Stone', theme: stoneTheme},
  gothic: {label: 'Gothic', theme: gothicTheme, darkOnly: true},
  y2k: {label: 'Y2K', theme: y2kTheme},
} as const satisfies Record<string, {label: string; theme: DefinedTheme; darkOnly?: boolean}>;

export type PresetId = keyof typeof PRESETS;

/** Gothic is designed dark-only; forcing light mode on it breaks contrast. */
export function isDarkOnly(id: PresetId) {
  return 'darkOnly' in PRESETS[id] && PRESETS[id].darkOnly === true;
}

/** The mode the preview actually renders in. */
export function effectiveMode(s: ThemeSettings): 'light' | 'dark' {
  return isDarkOnly(s.preset) ? 'dark' : s.mode;
}

// Font pairings. "theme" keeps whatever fonts the preset ships with.
export const FONT_PAIRS = {
  theme: {label: 'Theme default'},
  modern: {label: 'Modern · Inter', heading: 'Inter', body: 'Inter'},
  friendly: {label: 'Friendly · DM Sans', heading: 'DM Sans', body: 'DM Sans'},
  editorial: {label: 'Editorial · Fraunces + Inter', heading: 'Fraunces', body: 'Inter'},
  classic: {
    label: 'Classic · Playfair + Source Sans',
    heading: 'Playfair Display',
    body: 'Source Sans 3',
  },
  techy: {label: 'Techy · Space Grotesk', heading: 'Space Grotesk', body: 'Space Grotesk'},
  mono: {label: 'Coder · JetBrains Mono', heading: 'JetBrains Mono', body: 'Inter'},
} as const satisfies Record<string, {label: string; heading?: string; body?: string}>;

export type FontPairId = keyof typeof FONT_PAIRS;

export const ACCENT_SWATCHES = [
  '#0064E0',
  '#7C3AED',
  '#DB2777',
  '#E8590C',
  '#2F9E44',
  '#0C8599',
  '#1F2937',
];

export type Spacing = 'tight' | 'normal' | 'airy';
const SPACING_FACTOR: Record<Spacing, number> = {tight: 0.8, normal: 1, airy: 1.3};

// Base spacing scale in rem (matches Astryx defaults).
const SPACING_STEPS: Record<string, number> = {
  '--spacing-0-5': 0.125,
  '--spacing-1': 0.25,
  '--spacing-1-5': 0.375,
  '--spacing-2': 0.5,
  '--spacing-3': 0.75,
  '--spacing-4': 1,
  '--spacing-5': 1.25,
  '--spacing-6': 1.5,
  '--spacing-7': 1.75,
  '--spacing-8': 2,
  '--spacing-9': 2.25,
  '--spacing-10': 2.5,
  '--spacing-11': 2.75,
  '--spacing-12': 3,
};

export interface ThemeSettings {
  preset: PresetId;
  /** null = keep the preset's own accent color */
  accent: string | null;
  fonts: FontPairId;
  /** null = keep the preset's corners. 0 = sharp, 1 = soft, 2 = round */
  roundness: number | null;
  spacing: Spacing;
  /** null = keep the preset's text sizes */
  textSize: 'smaller' | 'larger' | null;
  mode: 'light' | 'dark';
}

export const DEFAULT_THEME: ThemeSettings = {
  preset: 'neutral',
  accent: null,
  fonts: 'theme',
  roundness: null,
  spacing: 'normal',
  textSize: null,
  mode: 'light',
};

const FALLBACK_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const FALLBACK_SERIF = 'Georgia, "Times New Roman", serif';
const SERIFS = new Set(['Fraunces', 'Playfair Display']);

// Astryx files a theme's styles under its name, so two different looks on one
// page (the home page shows ten) need two different names. The name is worked
// out from the settings: same settings, same name.
function themeName(s: ThemeSettings): string {
  const text = JSON.stringify([s.preset, s.accent, s.fonts, s.roundness, s.spacing, s.textSize]);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  }
  return `portfolio-${(hash >>> 0).toString(36)}`;
}

/** Turns the editor's settings into a live Astryx theme. */
export function buildTheme(s: ThemeSettings): DefinedTheme {
  const base = PRESETS[s.preset].theme;
  const fonts = FONT_PAIRS[s.fonts];

  const tokens: Record<string, string> = {};
  if (s.spacing !== 'normal') {
    const f = SPACING_FACTOR[s.spacing];
    for (const [name, rem] of Object.entries(SPACING_STEPS)) {
      tokens[name] = `${+(rem * f).toFixed(3)}rem`;
    }
  }

  return defineTheme({
    name: themeName(s),
    extends: base,
    ...(s.accent ? {color: {accent: s.accent}} : {}),
    ...(s.roundness !== null ? {radius: {base: 4, multiplier: s.roundness}} : {}),
    typography: {
      ...(s.textSize ? {scale: {base: s.textSize === 'smaller' ? 14 : 18, ratio: 1.2}} : {}),
      ...('body' in fonts
        ? {
            body: {family: fonts.body, fallbacks: FALLBACK_SANS},
            heading: {
              family: fonts.heading,
              fallbacks: SERIFS.has(fonts.heading) ? FALLBACK_SERIF : FALLBACK_SANS,
            },
          }
        : {}),
    },
    tokens,
  });
}

/** The marketing site's own look: warm neutral, violet accent, editorial serif headings. */
export const SITE_THEME = defineTheme({
  name: 'plinth-site',
  extends: neutralTheme,
  // Neutrals are derived from a warm sand seed (paper-like page), then the
  // violet accent is set directly on top so it doesn't tint the page.
  color: {accent: '#A0784A', neutralStyle: 'warm'},
  tokens: {
    '--color-accent': ['#5B3DF5', '#9D8CFF'],
    '--color-on-accent': ['#FFFFFF', '#14102B'],
    '--color-text-accent': ['#4B2FE0', '#B3A6FF'],
    '--color-accent-muted': ['#ECE8FF', '#2A2550'],
  },
  radius: {base: 4, multiplier: 1.5},
  typography: {
    body: {family: 'Inter', fallbacks: FALLBACK_SANS},
    heading: {family: 'Fraunces', fallbacks: FALLBACK_SERIF},
  },
});
