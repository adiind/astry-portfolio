// Three finished portfolios that ship with the app. They are what a new
// visitor sees first, on the home page and when the studio opens.
// The people are made up. Pictures live in public/samples.

import type {Portfolio} from './portfolio';

export interface Sample {
  id: 'designer' | 'engineer' | 'illustrator';
  /** Short name for menus. */
  label: string;
  /** The person, for captions. */
  person: string;
  role: string;
  portfolio: Portfolio;
}

const img = (file: string) => `/samples/${file}`;

const DESIGNER: Portfolio = {
  theme: {
    preset: 'stone',
    accent: '#E8590C',
    fonts: 'editorial',
    roundness: null,
    spacing: 'normal',
    textSize: null,
    mode: 'light',
  },
  sections: [
    {
      id: 'hero',
      type: 'hero',
      layout: 'split',
      name: 'Jordan Vale',
      headline: 'Product designer who ships',
      intro:
        'I turn messy problems into products people enjoy using. Eight years across fintech, health, and tools for people who work outdoors.',
      primaryLabel: 'See my work',
      secondaryLabel: 'Get in touch',
      photo: img('jordan-a.webp'),
    },
    {
      id: 'stats',
      type: 'stats',
      layout: 'row',
      heading: '',
      items: [
        {id: 's1', value: '8 yrs', label: 'Designing products'},
        {id: 's2', value: '40', label: 'Features shipped'},
        {id: 's3', value: '3x', label: 'Activation lift at Tidepool'},
      ],
    },
    {
      id: 'projects',
      type: 'projects',
      layout: 'list',
      heading: 'Selected work',
      items: [
        {
          id: 'p1',
          title: 'Fieldnote',
          description:
            'A notes app for building surveyors that works with no signal. Cut the time to sync a site visit from four minutes to twenty seconds.',
          tags: ['Mobile', 'Research', 'Offline'],
          url: '',
          image: img('fieldnote.svg'),
        },
        {
          id: 'p2',
          title: 'Tidepool Bank',
          description:
            'Rebuilt sign-up for a digital bank. Three times as many new customers now finish opening an account.',
          tags: ['Fintech', 'Onboarding'],
          url: '',
          image: img('tidepool.svg'),
        },
        {
          id: 'p3',
          title: 'Lumen Kit',
          description:
            'A design system used by twelve product teams: 60 components, one source of truth for colour and type.',
          tags: ['Design systems', 'Accessibility'],
          url: '',
          image: img('lumen.svg'),
        },
      ],
    },
    {
      id: 'about',
      type: 'about',
      layout: 'split',
      heading: 'About',
      body:
        'I started in print, moved to web, and stayed for the feedback loop. I like small teams, sitting in on support calls, and prototypes that are rough enough to throw away. Outside work I draw maps of places that do not exist.',
      skills: ['Product design', 'Prototyping', 'Design systems', 'User research', 'Figma', 'React'],
      photo: img('jordan-b.webp'),
    },
    {
      id: 'process',
      type: 'gallery',
      layout: 'grid',
      heading: 'How I work',
      items: [
        {id: 'g1', image: img('jordan-c.webp'), caption: 'Paper first. Every flow starts in a notebook.'},
        {id: 'g2', image: img('lumen.svg'), caption: 'Then components, so the team builds from one kit.'},
        {id: 'g3', image: img('fieldnote.svg'), caption: 'Then real screens, tested on site.'},
      ],
    },
    {
      id: 'experience',
      type: 'experience',
      layout: 'list',
      heading: 'Experience',
      items: [
        {
          id: 'j1',
          role: 'Senior product designer',
          company: 'Northwind Labs',
          period: '2023 to now',
          summary: 'Lead designer for the field tools team. Shipped Fieldnote from first sketch to 9,000 weekly users.',
        },
        {
          id: 'j2',
          role: 'Product designer',
          company: 'Tidepool',
          period: '2020 to 2023',
          summary: 'Owned sign-up and the savings goals feature.',
        },
        {
          id: 'j3',
          role: 'Designer',
          company: 'Paper & Pixel Studio',
          period: '2017 to 2020',
          summary: 'Brand and web work for forty small businesses.',
        },
      ],
    },
    {
      id: 'testimonials',
      type: 'testimonials',
      layout: 'grid',
      heading: 'Kind words',
      items: [
        {
          id: 'q1',
          quote: 'Jordan asks the question everyone else was avoiding, then draws the answer by Friday.',
          author: 'Sam Ortiz',
          role: 'PM, Tidepool',
          avatar: '',
        },
        {
          id: 'q2',
          quote: 'The only designer whose handoff files I have never had to ask a question about.',
          author: 'Priya Natarajan',
          role: 'Engineering lead, Northwind',
          avatar: '',
        },
      ],
    },
    {
      id: 'contact',
      type: 'contact',
      layout: 'card',
      heading: "Let's work together",
      body: 'Open to senior product design roles and the occasional freelance project.',
      email: 'hello@example.com',
      links: [
        {id: 'l1', label: 'LinkedIn', url: 'https://example.com'},
        {id: 'l2', label: 'Dribbble', url: 'https://example.com'},
      ],
    },
  ],
};

const ENGINEER: Portfolio = {
  theme: {
    preset: 'gothic',
    accent: '#2F9E44',
    fonts: 'mono',
    roundness: 0.5,
    spacing: 'normal',
    textSize: null,
    mode: 'dark',
  },
  sections: [
    {
      id: 'hero',
      type: 'hero',
      layout: 'split',
      name: 'Noor Haddad',
      headline: 'I make slow systems fast',
      intro:
        'Backend engineer. I work on the parts nobody sees until they break: queues, deploys, and the 3am pager.',
      primaryLabel: 'Read the write-ups',
      secondaryLabel: 'Email me',
      photo: img('noor.jpg'),
    },
    {
      id: 'stats',
      type: 'stats',
      layout: 'cards',
      heading: '',
      items: [
        {id: 's1', value: '41 ms', label: 'p99 latency, down from 220'},
        {id: 's2', value: '99.98%', label: 'Uptime, last 26 weeks'},
        {id: 's3', value: '9x', label: 'Jobs per minute after the rewrite'},
      ],
    },
    {
      id: 'projects',
      type: 'projects',
      layout: 'grid',
      heading: 'Things I built',
      items: [
        {
          id: 'p1',
          title: 'ferry',
          description: 'A deploy tool that rolls out 42 services in one command and rolls back on its own when checks fail.',
          tags: ['Go', 'Kubernetes', 'CLI'],
          url: '',
          image: img('cover-cli.svg'),
        },
        {
          id: 'p2',
          title: 'Latency board',
          description: 'One screen that answers "is it us?" in five seconds. Replaced eleven dashboards.',
          tags: ['Observability', 'TypeScript'],
          url: '',
          image: img('cover-metrics.svg'),
        },
        {
          id: 'p3',
          title: 'Queue rewrite',
          description: 'Moved the job runner from one-at-a-time to batches of 64. Same hardware, nine times the work.',
          tags: ['Rust', 'Postgres'],
          url: '',
          image: img('cover-diff.svg'),
        },
      ],
    },
    {
      id: 'about',
      type: 'about',
      layout: 'stacked',
      heading: 'About',
      body:
        'I learned to code fixing a school timetable script and never stopped. I like boring technology, short functions, and graphs that go down and to the right. I write up every incident so the next person sleeps better.',
      skills: ['Go', 'Rust', 'Postgres', 'Kubernetes', 'Tracing', 'On-call'],
      photo: '',
    },
    {
      id: 'experience',
      type: 'experience',
      layout: 'cards',
      heading: 'Experience',
      items: [
        {
          id: 'j1',
          role: 'Staff engineer, platform',
          company: 'Harbor',
          period: '2022 to now',
          summary: 'Own deploys and the job system for 60 engineers.',
        },
        {
          id: 'j2',
          role: 'Backend engineer',
          company: 'Kettle',
          period: '2018 to 2022',
          summary: 'Payments and search. Took checkout from 1.2s to 300ms.',
        },
      ],
    },
    {
      id: 'contact',
      type: 'contact',
      layout: 'plain',
      heading: 'Say hi',
      body: 'Happy to talk about platform roles, or your worst outage.',
      email: 'noor@example.com',
      links: [
        {id: 'l1', label: 'GitHub', url: 'https://example.com'},
        {id: 'l2', label: 'Blog', url: 'https://example.com'},
      ],
    },
  ],
};

const ILLUSTRATOR: Portfolio = {
  theme: {
    preset: 'butter',
    accent: '#DB2777',
    fonts: 'friendly',
    roundness: 2,
    spacing: 'airy',
    textSize: null,
    mode: 'light',
  },
  sections: [
    {
      id: 'hero',
      type: 'hero',
      layout: 'centered',
      name: 'Theo Marsh',
      headline: 'Loud colours, simple shapes',
      intro: 'Illustrator and poster maker. Book covers, festival identities, and the odd bakery.',
      primaryLabel: 'See the posters',
      secondaryLabel: 'Commission me',
      photo: img('theo.jpg'),
    },
    {
      id: 'gallery',
      type: 'gallery',
      layout: 'mosaic',
      heading: 'Posters',
      items: [
        {id: 'g1', image: img('poster-sun.svg'), caption: 'Slow Sundays'},
        {id: 'g2', image: img('poster-citrus.svg'), caption: 'Citrus, pattern for a tea towel'},
        {id: 'g3', image: img('poster-ok.svg'), caption: 'OK, two-colour riso'},
        {id: 'g4', image: img('poster-jazz.svg'), caption: 'Night Jazz at The Cellar'},
        {id: 'g5', image: img('poster-hills.svg'), caption: 'Far hills'},
        {id: 'g6', image: img('poster-plants.svg'), caption: 'House plants'},
      ],
    },
    {
      id: 'projects',
      type: 'projects',
      layout: 'grid',
      heading: 'Client work',
      items: [
        {
          id: 'p1',
          title: 'Three covers for Paperhouse',
          description: 'A set of paperback covers that had to look like a family on the shelf.',
          tags: ['Book covers'],
          url: '',
          image: img('cover-books.svg'),
        },
        {
          id: 'p2',
          title: 'Crumb & Co.',
          description: 'Name, logo, bags and signs for a bakery that sells out by two.',
          tags: ['Branding', 'Packaging'],
          url: '',
          image: img('cover-bakery.svg'),
        },
        {
          id: 'p3',
          title: 'Field Day festival',
          description: 'Forty posters, six thousand wristbands, one very large banner.',
          tags: ['Identity', 'Print'],
          url: '',
          image: img('cover-festival.svg'),
        },
      ],
    },
    {
      id: 'about',
      type: 'about',
      layout: 'stacked',
      heading: 'About',
      body:
        'I draw with cut paper first and a computer second. I studied printmaking, worked in a sign shop, and still think the best brief fits on a napkin.',
      skills: ['Illustration', 'Poster design', 'Riso printing', 'Lettering', 'Packaging'],
      photo: '',
    },
    {
      id: 'testimonials',
      type: 'testimonials',
      layout: 'spotlight',
      heading: '',
      items: [
        {
          id: 'q1',
          quote: 'We asked for one poster. People stole them off the walls, so we asked for forty.',
          author: 'Dana Whitlock',
          role: 'Director, Field Day',
          avatar: '',
        },
      ],
    },
    {
      id: 'contact',
      type: 'contact',
      layout: 'card',
      heading: 'Got a wall that needs a poster?',
      body: 'Commissions open from March. Prints ship worldwide.',
      email: 'theo@example.com',
      links: [
        {id: 'l1', label: 'Instagram', url: 'https://example.com'},
        {id: 'l2', label: 'Print shop', url: 'https://example.com'},
      ],
    },
  ],
};

export const SAMPLES: Sample[] = [
  {id: 'designer', label: 'Product designer', person: 'Jordan Vale', role: 'Product designer', portfolio: DESIGNER},
  {id: 'engineer', label: 'Software engineer', person: 'Noor Haddad', role: 'Backend engineer', portfolio: ENGINEER},
  {id: 'illustrator', label: 'Illustrator', person: 'Theo Marsh', role: 'Illustrator', portfolio: ILLUSTRATOR},
];

export const getSample = (id: string | null | undefined): Sample | undefined =>
  SAMPLES.find(s => s.id === id);

/** What the studio opens with the first time. */
export const SAMPLE_PORTFOLIO: Portfolio = DESIGNER;
