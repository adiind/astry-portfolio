// A portfolio is just data: a list of sections plus theme settings.
// The editor preview and the public page both render from this same object.

import type {ThemeSettings} from './themes';

/**
 * An image is stored as a plain string:
 *   ''              no image yet
 *   '/samples/...'  a file that ships with the app
 *   'idb:<id>'      a photo uploaded in this browser (see imageStore.ts)
 *   'https://...'   a picture hosted somewhere else
 */
export type ImageRef = string;

export interface HeroSection {
  type: 'hero';
  layout: 'centered' | 'split';
  name: string;
  headline: string;
  intro: string;
  primaryLabel: string;
  secondaryLabel: string;
  photo: ImageRef;
}
export interface AboutSection {
  type: 'about';
  layout: 'stacked' | 'split';
  heading: string;
  body: string;
  skills: string[];
  photo: ImageRef;
}
export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  url: string;
  image: ImageRef;
}
export interface ProjectsSection {
  type: 'projects';
  layout: 'grid' | 'list';
  heading: string;
  items: Project[];
}
export interface Job {
  id: string;
  role: string;
  company: string;
  period: string;
  summary: string;
}
export interface ExperienceSection {
  type: 'experience';
  layout: 'list' | 'cards';
  heading: string;
  items: Job[];
}
export interface Quote {
  id: string;
  quote: string;
  author: string;
  role: string;
  avatar: ImageRef;
}
export interface TestimonialsSection {
  type: 'testimonials';
  layout: 'grid' | 'spotlight';
  heading: string;
  items: Quote[];
}
export interface Stat {
  id: string;
  value: string;
  label: string;
}
export interface StatsSection {
  type: 'stats';
  layout: 'row' | 'cards';
  heading: string;
  items: Stat[];
}
export interface TextSection {
  type: 'text';
  layout: 'left' | 'centered';
  heading: string;
  body: string;
}
export interface ContactLink {
  id: string;
  label: string;
  url: string;
}
export interface ContactSection {
  type: 'contact';
  layout: 'card' | 'plain';
  heading: string;
  body: string;
  email: string;
  links: ContactLink[];
}

export interface Shot {
  id: string;
  image: ImageRef;
  caption: string;
}
export interface GallerySection {
  type: 'gallery';
  layout: 'grid' | 'mosaic';
  heading: string;
  items: Shot[];
}

export type SectionData =
  | HeroSection
  | AboutSection
  | ProjectsSection
  | GallerySection
  | ExperienceSection
  | TestimonialsSection
  | StatsSection
  | TextSection
  | ContactSection;

export type SectionType = SectionData['type'];

export type PortfolioSection = SectionData & {id: string; isHidden?: boolean};

export interface Portfolio {
  sections: PortfolioSection[];
  theme: ThemeSettings;
}

export function newId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Name, one-line description, and layout choices for each section type. */
export const SECTION_META: Record<
  SectionType,
  {label: string; description: string; layouts: {value: string; label: string}[]}
> = {
  hero: {
    label: 'Hero',
    description: 'Your name, headline, and main buttons',
    layouts: [
      {value: 'centered', label: 'Centered'},
      {value: 'split', label: 'Side by side'},
    ],
  },
  about: {
    label: 'About',
    description: 'A short bio and your skills',
    layouts: [
      {value: 'stacked', label: 'Stacked'},
      {value: 'split', label: 'Two columns'},
    ],
  },
  projects: {
    label: 'Projects',
    description: 'Your best work',
    layouts: [
      {value: 'grid', label: 'Grid'},
      {value: 'list', label: 'List'},
    ],
  },
  gallery: {
    label: 'Gallery',
    description: 'A wall of pictures: photos, posters, sketches',
    layouts: [
      {value: 'grid', label: 'Even grid'},
      {value: 'mosaic', label: 'Mosaic'},
    ],
  },
  experience: {
    label: 'Experience',
    description: 'Jobs and roles over time',
    layouts: [
      {value: 'list', label: 'List'},
      {value: 'cards', label: 'Cards'},
    ],
  },
  testimonials: {
    label: 'Testimonials',
    description: 'Kind words from people you worked with',
    layouts: [
      {value: 'grid', label: 'Grid'},
      {value: 'spotlight', label: 'Spotlight'},
    ],
  },
  stats: {
    label: 'Stats',
    description: 'A few big numbers that prove impact',
    layouts: [
      {value: 'row', label: 'Row'},
      {value: 'cards', label: 'Cards'},
    ],
  },
  text: {
    label: 'Text',
    description: 'A heading and a paragraph, for anything else',
    layouts: [
      {value: 'left', label: 'Left'},
      {value: 'centered', label: 'Centered'},
    ],
  },
  contact: {
    label: 'Contact',
    description: 'Email and links',
    layouts: [
      {value: 'card', label: 'Card'},
      {value: 'plain', label: 'Plain'},
    ],
  },
};

export const SECTION_LABELS: Record<SectionType, string> = Object.fromEntries(
  Object.entries(SECTION_META).map(([k, v]) => [k, v.label]),
) as Record<SectionType, string>;

// Blank list items, used by "Add project", "Add role", and so on.
export const newProject = (): Project => ({
  id: newId('p'),
  title: 'New project',
  description: 'What it is and why it mattered.',
  tags: [],
  url: '',
  image: '',
});
export const newShot = (): Shot => ({id: newId('g'), image: '', caption: ''});
export const newJob = (): Job => ({
  id: newId('j'),
  role: 'Role',
  company: 'Company',
  period: '2024 – now',
  summary: 'What you did there.',
});
export const newQuote = (): Quote => ({
  id: newId('q'),
  quote: 'Something kind someone said about working with you.',
  author: 'Their name',
  role: 'Their role',
  avatar: '',
});
export const newStat = (): Stat => ({id: newId('s'), value: '10x', label: 'What the number means'});
export const newLink = (): ContactLink => ({id: newId('l'), label: 'Website', url: 'https://'});

/** A fresh section of the given type, with starter content to edit. */
export function createSection(type: SectionType): PortfolioSection {
  const id = newId(type);
  switch (type) {
    case 'hero':
      return {
        id,
        type,
        layout: 'centered',
        name: 'Your name',
        headline: 'What you do, in a few words',
        intro: 'One or two sentences about you.',
        primaryLabel: 'See my work',
        secondaryLabel: 'Get in touch',
        photo: '',
      };
    case 'about':
      return {id, type, layout: 'stacked', heading: 'About', body: 'A short bio.', skills: [], photo: ''};
    case 'gallery':
      return {id, type, layout: 'grid', heading: 'Gallery', items: [newShot(), newShot(), newShot()]};
    case 'projects':
      return {id, type, layout: 'grid', heading: 'Projects', items: [newProject()]};
    case 'experience':
      return {id, type, layout: 'list', heading: 'Experience', items: [newJob()]};
    case 'testimonials':
      return {id, type, layout: 'grid', heading: 'Kind words', items: [newQuote()]};
    case 'stats':
      return {id, type, layout: 'row', heading: 'By the numbers', items: [newStat(), newStat()]};
    case 'text':
      return {id, type, layout: 'left', heading: 'Heading', body: 'Write anything here.'};
    case 'contact':
      return {
        id,
        type,
        layout: 'card',
        heading: 'Get in touch',
        body: 'Say hello.',
        email: 'hello@example.com',
        links: [],
      };
  }
}

/** Fills in fields added after a draft was saved, so old drafts keep working. */
export function upgradeSection(s: PortfolioSection): PortfolioSection {
  const fresh = createSection(s.type);
  const merged = {...fresh, ...s} as PortfolioSection;
  const withIds = <T extends {id?: string}>(items: T[] | undefined, p: string) =>
    (items ?? []).map(it => ({...it, id: it.id ?? newId(p)}));
  if (merged.type === 'projects')
    merged.items = withIds(merged.items, 'p').map(p => ({...p, url: p.url ?? '', image: p.image ?? ''}));
  if (merged.type === 'gallery')
    merged.items = withIds(merged.items, 'g').map(g => ({...g, image: g.image ?? '', caption: g.caption ?? ''}));
  if (merged.type === 'experience') merged.items = withIds(merged.items, 'j');
  if (merged.type === 'testimonials')
    merged.items = withIds(merged.items, 'q').map(q => ({...q, avatar: q.avatar ?? ''}));
  if (merged.type === 'stats') merged.items = withIds(merged.items, 's');
  if (merged.type === 'contact') merged.links = withIds(merged.links, 'l');
  return merged;
}
