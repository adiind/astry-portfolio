// The AI builder's "hands". The AI never edits the page directly. It asks for
// one of the five actions below, and this file checks the request and makes
// the change. Everything here is plain data in, plain data out (no browser, no
// network), so it can be tested on its own.

import {
  createSection,
  newJob,
  newLink,
  newProject,
  newQuote,
  newShot,
  newStat,
  SECTION_META,
  type Portfolio,
  type PortfolioSection,
  type SectionType,
} from './portfolio';
import type {FontPairId, PresetId, Spacing, ThemeSettings} from './themes';

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  ok: boolean;
  /** Sent back to the AI, so it knows what happened. Includes ids. */
  message: string;
  /** Shown to the person in the chat. Short, no ids. */
  label: string;
}

export interface AppliedCall {
  call: ToolCall;
  /** For add_section: the id the new section was given. */
  sectionId?: string;
}

export interface ApplyOutcome {
  portfolio: Portfolio;
  result: ToolResult;
  sectionId?: string;
}

// The looks and fonts the AI may pick from. Kept as plain lists (not read from
// themes.ts) so this file stays free of design-system code. The two checks
// under them fail the build if a look or font pair is added and not listed.
const PRESET_IDS = ['neutral', 'butter', 'chocolate', 'matcha', 'stone', 'gothic', 'y2k'] as const;
const FONT_IDS = ['theme', 'modern', 'friendly', 'editorial', 'classic', 'techy', 'mono'] as const;
const DARK_ONLY: readonly PresetId[] = ['gothic'];
const SPACINGS: readonly Spacing[] = ['tight', 'normal', 'airy'];
const CORNERS = {theme: null, sharp: 0, soft: 1, round: 2} as const;
const TEXT_SIZES = {theme: null, smaller: 'smaller', larger: 'larger'} as const;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const presetsListed: Same<PresetId, (typeof PRESET_IDS)[number]> = true;
const fontsListed: Same<FontPairId, (typeof FONT_IDS)[number]> = true;
void presetsListed;
void fontsListed;

const SECTION_TYPES = Object.keys(SECTION_META) as SectionType[];

const MAX_TEXT = 2000;
const MAX_ITEMS = 12;
const MAX_TAGS = 12;
const MAX_TAG_TEXT = 40;

/** Which plain text fields each section type has. */
const TEXT_FIELDS: Record<SectionType, readonly string[]> = {
  hero: ['name', 'headline', 'intro', 'primaryLabel', 'secondaryLabel'],
  about: ['heading', 'body'],
  projects: ['heading'],
  gallery: ['heading'],
  experience: ['heading'],
  testimonials: ['heading'],
  stats: ['heading'],
  text: ['heading', 'body'],
  contact: ['heading', 'body', 'email'],
};

type Item = {id: string} & Record<string, unknown>;

/** For sections that hold a list: what one entry looks like. */
const LISTS: Partial<
  Record<SectionType, {key: 'items' | 'links'; fields: readonly string[]; hasTags?: boolean; make: () => Item}>
> = {
  projects: {key: 'items', fields: ['title', 'description', 'url'], hasTags: true, make: () => ({...newProject()})},
  gallery: {key: 'items', fields: ['caption'], make: () => ({...newShot()})},
  experience: {key: 'items', fields: ['role', 'company', 'period', 'summary'], make: () => ({...newJob()})},
  testimonials: {key: 'items', fields: ['quote', 'author', 'role'], make: () => ({...newQuote()})},
  stats: {key: 'items', fields: ['value', 'label'], make: () => ({...newStat()})},
  contact: {key: 'links', fields: ['label', 'url'], make: () => ({...newLink()})},
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const clamp = (text: string, max = MAX_TEXT) => text.slice(0, max);

function textList(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  return v
    .filter((x): x is string => typeof x === 'string')
    .map(x => clamp(x.trim(), MAX_TAG_TEXT))
    .filter(Boolean)
    .slice(0, MAX_TAGS);
}

/**
 * Links end up as real clickable links on the page, so only ordinary web and
 * email addresses are let through. Anything else becomes "no link".
 */
export function safeUrl(v: unknown): string {
  if (typeof v !== 'string') return '';
  const url = v.trim().slice(0, 500);
  if (url === '') return '';
  if (/^(https?:\/\/|mailto:)/i.test(url)) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return '';
  if (/^[^\s/]+\.[^\s]+$/.test(url)) return `https://${url}`;
  return '';
}

const fail = (label: string, message: string): ToolResult => ({ok: false, label, message});

function sectionLabel(s: {type: SectionType}) {
  return SECTION_META[s.type].label;
}

/** Copies the allowed, well-formed fields of `content` onto a section. */
function applyContent(
  section: PortfolioSection,
  content: unknown,
  mode: 'add' | 'update',
): {section: PortfolioSection; ignored: string[]; changed: string[]} {
  if (!isRecord(content)) return {section, ignored: [], changed: []};

  const next = {...section} as Record<string, unknown> & PortfolioSection;
  const ignored: string[] = [];
  const changed: string[] = [];
  const list = LISTS[section.type];
  const handled = new Set<string>();

  for (const field of TEXT_FIELDS[section.type]) {
    handled.add(field);
    const value = content[field];
    if (typeof value === 'string') {
      next[field] = clamp(value);
      changed.push(field);
    }
  }

  if (section.type === 'about') {
    handled.add('skills');
    const skills = textList(content.skills);
    if (skills) {
      next.skills = skills;
      changed.push('skills');
    }
  }

  if (list) {
    // The AI always calls the list "items", except on Contact where it is "links".
    handled.add(list.key);
    handled.add('removeItemIds');
    const current = (next[list.key] as Item[]) ?? [];
    let entries = current;

    const removeIds = textList(content.removeItemIds);
    if (removeIds && removeIds.length > 0) {
      entries = entries.filter(e => !removeIds.includes(e.id));
      changed.push(`removed ${current.length - entries.length}`);
    }

    const given = content[list.key];
    if (Array.isArray(given)) {
      const fill = (base: Item, from: Record<string, unknown>): Item => {
        const out: Item = {...base};
        for (const f of list.fields) {
          if (typeof from[f] !== 'string') continue;
          out[f] = f === 'url' ? safeUrl(from[f]) : clamp(from[f] as string);
        }
        if (list.hasTags) {
          const tags = textList(from.tags);
          if (tags) out.tags = tags;
        }
        return out;
      };

      const wanted = given.filter(isRecord).slice(0, MAX_ITEMS);
      if (mode === 'add') {
        // A new section: the AI's entries replace the placeholder ones.
        if (wanted.length > 0) entries = wanted.map(w => fill(list.make(), w));
      } else {
        entries = [...entries];
        for (const w of wanted) {
          const at = typeof w.id === 'string' ? entries.findIndex(e => e.id === w.id) : -1;
          if (at >= 0) entries[at] = fill(entries[at], w);
          else if (entries.length < MAX_ITEMS) entries.push(fill(list.make(), w));
        }
      }
      if (wanted.length > 0) changed.push(list.key);
    }
    next[list.key] = entries;
  }

  for (const key of Object.keys(content)) {
    if (!handled.has(key)) ignored.push(key);
  }
  return {section: next, ignored, changed};
}

function findSection(p: Portfolio, id: unknown) {
  return typeof id === 'string' ? p.sections.findIndex(s => s.id === id) : -1;
}

function clampIndex(v: unknown, max: number, fallback: number) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.max(0, Math.min(max, Math.round(v)));
}

const noSuchSection = (id: unknown, p: Portfolio) =>
  `No section has the id ${JSON.stringify(id)}. The ids are: ${p.sections.map(s => s.id).join(', ') || '(none)'}.`;

function addSection(p: Portfolio, args: Record<string, unknown>, pinnedId?: string): ApplyOutcome {
  const type = args.type as SectionType;
  if (!SECTION_TYPES.includes(type)) {
    return {
      portfolio: p,
      result: fail('Could not add a section', `Unknown section type. Use one of: ${SECTION_TYPES.join(', ')}.`),
    };
  }
  let section = createSection(type);
  if (pinnedId) section = {...section, id: pinnedId};

  if (args.layout !== undefined) {
    const layouts = SECTION_META[type].layouts.map(l => l.value);
    if (!layouts.includes(args.layout as string)) {
      return {
        portfolio: p,
        result: fail(
          `Could not add ${sectionLabel(section)}`,
          `A ${type} section has no layout ${JSON.stringify(args.layout)}. Use one of: ${layouts.join(', ')}.`,
        ),
      };
    }
    section = {...section, layout: args.layout} as PortfolioSection;
  }

  const {section: filled, ignored} = applyContent(section, args.content, 'add');
  const index = clampIndex(args.position, p.sections.length, p.sections.length);
  const sections = [...p.sections];
  sections.splice(index, 0, filled);

  const note = ignored.length ? ` Ignored fields this section does not have: ${ignored.join(', ')}.` : '';
  return {
    portfolio: {...p, sections},
    sectionId: filled.id,
    result: {
      ok: true,
      label: `Added ${sectionLabel(filled)}`,
      message: `Added a ${type} section with id ${filled.id} at position ${index}.${note} It now holds: ${JSON.stringify(describeSection(filled))}`,
    },
  };
}

function updateSection(p: Portfolio, args: Record<string, unknown>): ApplyOutcome {
  const at = findSection(p, args.sectionId);
  if (at < 0) return {portfolio: p, result: fail('Could not find that section', noSuchSection(args.sectionId, p))};

  let section = p.sections[at];
  const changed: string[] = [];

  if (args.layout !== undefined) {
    const layouts = SECTION_META[section.type].layouts.map(l => l.value);
    if (!layouts.includes(args.layout as string)) {
      return {
        portfolio: p,
        result: fail(
          `Could not change ${sectionLabel(section)}`,
          `A ${section.type} section has no layout ${JSON.stringify(args.layout)}. Use one of: ${layouts.join(', ')}.`,
        ),
      };
    }
    section = {...section, layout: args.layout} as PortfolioSection;
    changed.push('layout');
  }
  if (typeof args.hidden === 'boolean') {
    section = {...section, isHidden: args.hidden};
    changed.push(args.hidden ? 'hidden' : 'shown');
  }

  const content = applyContent(section, args.content, 'update');
  section = content.section;
  changed.push(...content.changed);

  if (changed.length === 0) {
    return {
      portfolio: p,
      result: fail(
        `Nothing to change in ${sectionLabel(section)}`,
        `Nothing was changed. A ${section.type} section accepts: layout, hidden, and content fields ${[
          ...TEXT_FIELDS[section.type],
          ...(section.type === 'about' ? ['skills'] : []),
          ...(LISTS[section.type] ? [LISTS[section.type]!.key, 'removeItemIds'] : []),
        ].join(', ')}.`,
      ),
    };
  }

  const sections = [...p.sections];
  sections[at] = section;
  const note = content.ignored.length
    ? ` Ignored fields this section does not have: ${content.ignored.join(', ')}.`
    : '';
  return {
    portfolio: {...p, sections},
    result: {
      ok: true,
      label: `Changed ${sectionLabel(section)}`,
      message: `Updated ${section.id} (${changed.join(', ')}).${note} It now holds: ${JSON.stringify(describeSection(section))}`,
    },
  };
}

function moveSection(p: Portfolio, args: Record<string, unknown>): ApplyOutcome {
  const from = findSection(p, args.sectionId);
  if (from < 0) return {portfolio: p, result: fail('Could not find that section', noSuchSection(args.sectionId, p))};
  if (typeof args.toIndex !== 'number') {
    return {portfolio: p, result: fail('Could not move a section', 'toIndex must be a number. 0 is the top.')};
  }
  const to = clampIndex(args.toIndex, p.sections.length - 1, from);
  const sections = [...p.sections];
  const [section] = sections.splice(from, 1);
  sections.splice(to, 0, section);
  return {
    portfolio: to === from ? p : {...p, sections},
    result: {
      ok: true,
      label: `Moved ${sectionLabel(section)}`,
      message: `${section.id} is now at position ${to}. Order: ${sections.map(s => s.id).join(', ')}.`,
    },
  };
}

function removeSection(p: Portfolio, args: Record<string, unknown>): ApplyOutcome {
  const at = findSection(p, args.sectionId);
  if (at < 0) return {portfolio: p, result: fail('Could not find that section', noSuchSection(args.sectionId, p))};
  const section = p.sections[at];
  return {
    portfolio: {...p, sections: p.sections.filter((_, i) => i !== at)},
    result: {ok: true, label: `Removed ${sectionLabel(section)}`, message: `Removed ${section.id}.`},
  };
}

function setTheme(p: Portfolio, args: Record<string, unknown>): ApplyOutcome {
  const theme: ThemeSettings = {...p.theme};
  const changed: string[] = [];
  const problems: string[] = [];
  const pick = <T extends string>(key: string, allowed: readonly T[]): T | undefined => {
    const value = args[key];
    if (value === undefined) return undefined;
    if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) {
      changed.push(key);
      return value as T;
    }
    problems.push(`${key} must be one of: ${allowed.join(', ')}`);
    return undefined;
  };

  theme.preset = pick('preset', PRESET_IDS) ?? theme.preset;
  theme.fonts = pick('fonts', FONT_IDS) ?? theme.fonts;
  theme.spacing = pick('spacing', SPACINGS) ?? theme.spacing;
  theme.mode = pick('mode', ['light', 'dark'] as const) ?? theme.mode;

  const corners = pick('corners', Object.keys(CORNERS) as (keyof typeof CORNERS)[]);
  if (corners) theme.roundness = CORNERS[corners];
  const size = pick('textSize', Object.keys(TEXT_SIZES) as (keyof typeof TEXT_SIZES)[]);
  if (size) theme.textSize = TEXT_SIZES[size];

  if (args.accent !== undefined) {
    if (args.accent === 'theme') {
      theme.accent = null;
      changed.push('accent');
    } else if (typeof args.accent === 'string' && /^#[0-9a-f]{6}$/i.test(args.accent)) {
      theme.accent = args.accent.toUpperCase();
      changed.push('accent');
    } else {
      problems.push('accent must be a colour like #1A2B3C, or "theme" for the look\'s own colour');
    }
  }

  if (changed.length === 0) {
    return {
      portfolio: p,
      result: fail(
        'Could not change the look',
        problems.length ? `Nothing was changed: ${problems.join('; ')}.` : 'Nothing was changed: no settings were given.',
      ),
    };
  }

  const notes: string[] = [];
  if (problems.length) notes.push(`Skipped: ${problems.join('; ')}.`);
  if (DARK_ONLY.includes(theme.preset) && theme.mode === 'light') {
    notes.push(`The ${theme.preset} look is always dark, so light mode has no effect on it.`);
  }
  return {
    portfolio: {...p, theme},
    result: {
      ok: true,
      label: 'Changed the look',
      message: `Look updated (${changed.join(', ')}). ${notes.join(' ')} It is now: ${JSON.stringify(describeTheme(theme))}`,
    },
  };
}

/**
 * Carries out one request from the AI. Never throws. A request that makes no
 * sense leaves the portfolio exactly as it was and says why.
 */
export function applyToolCall(p: Portfolio, call: ToolCall, opts?: {sectionId?: string}): ApplyOutcome {
  const args = isRecord(call.args) ? call.args : {};
  switch (call.name) {
    case 'add_section':
      return addSection(p, args, opts?.sectionId);
    case 'update_section':
      return updateSection(p, args);
    case 'move_section':
      return moveSection(p, args);
    case 'remove_section':
      return removeSection(p, args);
    case 'set_theme':
      return setTheme(p, args);
    default:
      return {
        portfolio: p,
        result: fail('Unknown action', `There is no tool called ${JSON.stringify(call.name)}.`),
      };
  }
}

/** Runs a recorded list of requests again, on a (possibly newer) portfolio. */
export function replayCalls(p: Portfolio, applied: AppliedCall[]): Portfolio {
  return applied.reduce((acc, a) => applyToolCall(acc, a.call, {sectionId: a.sectionId}).portfolio, p);
}

function describeTheme(t: ThemeSettings) {
  const corners = (Object.keys(CORNERS) as (keyof typeof CORNERS)[]).find(k => CORNERS[k] === t.roundness);
  return {
    preset: t.preset,
    accent: t.accent ?? 'theme',
    fonts: t.fonts,
    corners: corners ?? 'theme',
    spacing: t.spacing,
    textSize: t.textSize ?? 'theme',
    mode: t.mode,
  };
}

/** One section as the AI sees it: all the words, and yes/no for each picture. */
function describeSection(s: PortfolioSection) {
  const source = s as unknown as Record<string, unknown>;
  const content: Record<string, unknown> = {};
  for (const f of TEXT_FIELDS[s.type]) content[f] = source[f];
  if (s.type === 'about') content.skills = s.skills;
  if (s.type === 'hero' || s.type === 'about') content.hasPhoto = s.photo !== '';

  const list = LISTS[s.type];
  if (list) {
    content[list.key] = ((source[list.key] as Item[]) ?? []).map(item => {
      const out: Record<string, unknown> = {id: item.id};
      for (const f of list.fields) out[f] = item[f];
      if (list.hasTags) out.tags = item.tags;
      if ('image' in item) out.hasImage = item.image !== '';
      if ('avatar' in item) out.hasImage = item.avatar !== '';
      return out;
    });
  }
  return {id: s.id, type: s.type, layout: s.layout, hidden: s.isHidden === true, content};
}

/**
 * The whole portfolio written out for the AI to read before it answers.
 * Pictures are never sent, only whether one is there.
 */
export function describePortfolio(p: Portfolio): string {
  return JSON.stringify({
    theme: describeTheme(p.theme),
    sections: p.sections.map((s, position) => ({position, ...describeSection(s)})),
  });
}

// ---------------------------------------------------------------------------
// The menu of actions, in the format Gemini expects.
// ---------------------------------------------------------------------------

const STRING = {type: 'STRING'} as const;
const stringList = (description: string) => ({type: 'ARRAY', description, items: STRING});

const ITEM_SCHEMA = {
  type: 'OBJECT',
  properties: {
    id: {type: 'STRING', description: 'Only when changing an entry that already exists: its id.'},
    title: {type: 'STRING', description: 'projects: project name'},
    description: {type: 'STRING', description: 'projects: one or two sentences'},
    tags: stringList('projects: short tags'),
    url: {type: 'STRING', description: 'projects: link to the work, or empty'},
    role: {type: 'STRING', description: 'experience: job title. testimonials: the role of the person quoted'},
    company: {type: 'STRING', description: 'experience'},
    period: {type: 'STRING', description: 'experience: for example "2021 – 2024"'},
    summary: {type: 'STRING', description: 'experience: what they did there'},
    quote: {type: 'STRING', description: 'testimonials: what was said'},
    author: {type: 'STRING', description: 'testimonials: who said it'},
    value: {type: 'STRING', description: 'stats: the big number, for example "40%"'},
    label: {type: 'STRING', description: 'stats: what the number means'},
    caption: {type: 'STRING', description: 'gallery: caption under the picture'},
  },
};

const CONTENT_SCHEMA = {
  type: 'OBJECT',
  description:
    'The words in the section. Send only the fields you want to set. Fields that do not belong to the section type are ignored. ' +
    'hero: name, headline, intro, primaryLabel, secondaryLabel. about: heading, body, skills. ' +
    'projects, gallery, experience, testimonials, stats: heading, items. text: heading, body. ' +
    'contact: heading, body, email, links.',
  properties: {
    name: STRING,
    headline: STRING,
    intro: STRING,
    primaryLabel: {type: 'STRING', description: 'hero: text on the main button'},
    secondaryLabel: {type: 'STRING', description: 'hero: text on the second button'},
    heading: STRING,
    body: STRING,
    skills: stringList('about: short skill names'),
    email: STRING,
    items: {
      type: 'ARRAY',
      description:
        'Entries of a list section. With an existing id the entry is changed and keeps its picture. Without an id a new entry is added.',
      items: ITEM_SCHEMA,
    },
    links: {
      type: 'ARRAY',
      description: 'contact: links such as LinkedIn. Same id rule as items.',
      items: {type: 'OBJECT', properties: {id: STRING, label: STRING, url: STRING}},
    },
    removeItemIds: stringList('Ids of entries (items or links) to delete from this section.'),
  },
};

const LAYOUT_HELP = SECTION_TYPES.map(
  t => `${t}: ${SECTION_META[t].layouts.map(l => l.value).join(' or ')}`,
).join('; ');

export const TOOL_DECLARATIONS = [
  {
    name: 'add_section',
    description:
      'Adds a new section to the page. New sections start with placeholder words, so give the real words in content.',
    parameters: {
      type: 'OBJECT',
      properties: {
        type: {
          type: 'STRING',
          enum: SECTION_TYPES,
          description: SECTION_TYPES.map(t => `${t}: ${SECTION_META[t].description}`).join('. '),
        },
        layout: {type: 'STRING', description: `Optional. Allowed per type: ${LAYOUT_HELP}.`},
        position: {type: 'INTEGER', description: 'Where to put it. 0 is the top. Leave out to add at the bottom.'},
        content: CONTENT_SCHEMA,
      },
      required: ['type'],
    },
  },
  {
    name: 'update_section',
    description: 'Changes one existing section: its words, its layout, or whether it is hidden.',
    parameters: {
      type: 'OBJECT',
      properties: {
        sectionId: {type: 'STRING', description: 'The id of the section to change.'},
        layout: {type: 'STRING', description: `Allowed per type: ${LAYOUT_HELP}.`},
        hidden: {type: 'BOOLEAN', description: 'true hides the section from the page without deleting it.'},
        content: CONTENT_SCHEMA,
      },
      required: ['sectionId'],
    },
  },
  {
    name: 'move_section',
    description: 'Moves a section up or down the page.',
    parameters: {
      type: 'OBJECT',
      properties: {
        sectionId: STRING,
        toIndex: {type: 'INTEGER', description: 'The new position. 0 is the top.'},
      },
      required: ['sectionId', 'toIndex'],
    },
  },
  {
    name: 'remove_section',
    description: 'Deletes a section. Prefer update_section with hidden: true unless the person asked to delete it.',
    parameters: {
      type: 'OBJECT',
      properties: {sectionId: STRING},
      required: ['sectionId'],
    },
  },
  {
    name: 'set_theme',
    description: 'Changes how the whole page looks. Send only the settings you want to change.',
    parameters: {
      type: 'OBJECT',
      properties: {
        preset: {
          type: 'STRING',
          enum: [...PRESET_IDS],
          description:
            'The overall look. neutral: clean black and white. butter: warm yellow, friendly. chocolate: deep brown, rich. matcha: soft green, calm. stone: grey, architectural. gothic: dark and dramatic (always dark). y2k: loud, playful, retro.',
        },
        accent: {type: 'STRING', description: 'Highlight colour as #RRGGBB, or "theme" to use the look\'s own colour.'},
        fonts: {
          type: 'STRING',
          enum: [...FONT_IDS],
          description:
            'theme: the look\'s own fonts. modern: Inter. friendly: DM Sans. editorial: Fraunces serif headings. classic: Playfair serif headings. techy: Space Grotesk. mono: code-style headings.',
        },
        corners: {type: 'STRING', enum: Object.keys(CORNERS)},
        spacing: {type: 'STRING', enum: [...SPACINGS]},
        textSize: {type: 'STRING', enum: Object.keys(TEXT_SIZES)},
        mode: {type: 'STRING', enum: ['light', 'dark']},
      },
    },
  },
];

/** The standing instructions the AI gets with every message. */
export function builderInstructions(p: Portfolio): string {
  return [
    'You are the builder inside Plinth, an app where a person makes a one-page portfolio website.',
    'You change the page only by calling the tools. Never describe a change without calling the tool for it.',
    'Rules:',
    '- Do what was asked, then stop. Do not make changes nobody asked for.',
    '- If the person asks for a whole portfolio (for example "I am a wedding photographer, build my site"), build all of it in one go: rewrite the hero, then add or rewrite about, work, proof and contact sections, and pick a fitting look. Remove or hide placeholder sections that do not fit.',
    '- Write like a real person: specific, short, no buzzwords, no exclamation marks. Never invent facts that could be checked (client names, numbers, awards, quotes). When a fact is missing, write a neutral placeholder the person can spot and replace, and tell them.',
    '- You cannot add, change or see pictures. If pictures are needed, tell the person to add them in the Sections tab.',
    '- Use the section ids exactly as given. To change one entry in a list, pass its id.',
    '- When you are done, reply with one or two plain sentences saying what changed. No lists, no markdown.',
    '- If the request is unclear, ask one short question instead of guessing.',
    'This is the page right now (pictures are shown only as true or false):',
    describePortfolio(p),
  ].join('\n');
}
