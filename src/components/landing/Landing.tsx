'use client';

import {useEffect, useRef, type ReactNode} from 'react';
import Link from 'next/link';
import {useMediaQuery} from '@astryxdesign/core/hooks';
import {ArrowRightIcon} from '@heroicons/react/20/solid';
import {HeroDemo} from './HeroDemo';
import {Miniature} from './Miniature';
import {PRESETS, isDarkOnly, type PresetId, type ThemeSettings} from '@/lib/themes';
import {SAMPLES, SAMPLE_PORTFOLIO} from '@/lib/samples';
import {BRAND, PUBLIC_HOST} from '@/lib/brand';
import './landing.css';

// Content renders visible (server HTML, slow JS, and above-the-fold stay instant).
// Only things that start below the fold get hidden, then slide up when scrolled to.
function Reveal({children, delay = 0}: {children: ReactNode; delay?: number}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.style.transition = `opacity 420ms ease ${delay}ms, transform 420ms cubic-bezier(.2,.7,.2,1) ${delay}ms`;
        el.style.opacity = '1';
        el.style.transform = 'none';
        io.disconnect();
      },
      {rootMargin: '0px 0px -8% 0px'},
    );
    io.observe(el);
    return () => io.disconnect();
  }, [prefersReducedMotion, delay]);

  return <div ref={ref}>{children}</div>;
}

function CtaLink({
  href,
  children,
  variant,
  size,
}: {
  href: string;
  children: ReactNode;
  variant?: 'paper' | 'lime';
  size?: 'sm' | 'xl';
}) {
  const cls = ['pl-btn', variant && `pl-btn--${variant}`, size && `pl-btn--${size}`].filter(Boolean).join(' ');
  const isPage = href.startsWith('/');
  return isPage ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <a href={href} className={cls}>
      {children}
    </a>
  );
}

function SectionHead({tag, children, note}: {tag: string; children: ReactNode; note?: string}) {
  return (
    <Reveal>
      <div className="pl-section-head">
        <span className="pl-mono">{tag}</span>
        <div>
          <h2 className="pl-h2">{children}</h2>
          {note && <p className="pl-note">{note}</p>}
        </div>
      </div>
    </Reveal>
  );
}

const TICKER = [
  `${BRAND}: portfolios for people who ship`,
  'Free while in beta',
  '7 looks, 1 link',
  'No logo of ours on your page',
  'Bring your own Gemini key',
];

function Ticker() {
  // Two identical halves so the loop is seamless; the copy is hidden from screen readers.
  return (
    <div className="pl-ticker pl-mono" aria-hidden="true">
      <div className="pl-ticker-track">
        {TICKER.map(t => (
          <span key={t}>{t}</span>
        ))}
        {TICKER.map(t => (
          <span key={`b-${t}`}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function Nav() {
  return (
    <header className="pl-nav">
      <div className="pl-wrap pl-nav-in">
        <Link href="/" className="pl-logo">
          <i aria-hidden="true" />
          {BRAND}
        </Link>
        <nav className="pl-links" aria-label="Sections">
          <a href="#how">How it works</a>
          <a href="#examples">Examples</a>
          <a href="#themes">Looks</a>
          <a href="#faq">FAQ</a>
        </nav>
        <CtaLink href="/studio" size="sm" variant="lime">
          Open the studio
        </CtaLink>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="pl-wrap pl-hero">
      <span className="pl-kicker pl-mono">Portfolio builder · beta</span>
      <h1 className="pl-h1">
        Your work deserves a <span className="pl-mark">better</span> <span className="pl-serif">stage.</span>
      </h1>
      <div className="pl-hero-row">
        <div>
          <p className="pl-lede">
            A portfolio you&apos;re proud to send. Tell the AI builder about your work, add your photos, pick a look.
          </p>
          <div className="pl-cta-row">
            <CtaLink href="/studio" size="xl">
              Build yours free <ArrowRightIcon aria-hidden="true" />
            </CtaLink>
            <CtaLink href="#how" size="xl" variant="paper">
              See how it works
            </CtaLink>
          </div>
        </div>
        <div className="pl-stickers" aria-hidden="true">
          <span className="pl-sticker">No design skills</span>
          <span className="pl-sticker">Share one link</span>
          <span className="pl-sticker">Undo anything</span>
        </div>
      </div>
      <HeroDemo />
    </section>
  );
}

const FACTS = [
  {value: '7', label: 'looks to start from'},
  {value: '9', label: 'section types'},
  {value: '18', label: 'layouts'},
  {value: '1', label: 'link to share'},
];

function Stats() {
  return (
    <div className="pl-stats">
      <div className="pl-stats-grid">
        {FACTS.map(f => (
          <div key={f.label} className="pl-stat">
            <b>{f.value}</b>
            <span className="pl-mono">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  {title: 'Describe yourself', body: 'Tell the AI builder what you do. It drafts every section.'},
  {title: 'Add your photos', body: 'Your face, your work, your desk. Click a slot and pick a file.'},
  {title: 'Pick a look and share', body: `Publish to your own ${PUBLIC_HOST} link.`},
];

function HowItWorks() {
  return (
    <section id="how" className="pl-wrap pl-section">
      <SectionHead tag="01 / How it works">Blank page to finished in three steps.</SectionHead>
      <div className="pl-steps">
        {STEPS.map((s, i) => (
          <Reveal key={s.title} delay={i * 90}>
            <article className="pl-step">
              <span className="pl-step-n" aria-hidden="true">
                0{i + 1}
              </span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Frame({url, children}: {url: string; children: ReactNode}) {
  return (
    <div className="pl-window">
      <div className="pl-window-bar" aria-hidden="true">
        <i />
        <i />
        <i />
        <span className="pl-window-url pl-mono">{url}</span>
      </div>
      {children}
    </div>
  );
}

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

function Examples() {
  return (
    <section id="examples" className="pl-wrap pl-section">
      <SectionHead tag="02 / Examples" note="Fictional examples. Noor and Theo have AI-generated portraits.">
        Start from one that is already finished.
      </SectionHead>
      <div className="pl-examples">
        {SAMPLES.map((sample, i) => (
          <Reveal key={sample.id} delay={i * 90}>
            <div className="pl-ex">
              <Frame url={`${PUBLIC_HOST}/${slug(sample.person)}`}>
                <Miniature
                  sections={sample.portfolio.sections}
                  theme={sample.portfolio.theme}
                  ratio={3 / 4}
                  label={`${sample.person}'s finished portfolio`}
                />
              </Frame>
              <div className="pl-ex-cap">
                <span>
                  <b>{sample.person}</b>
                  <span className="pl-mono">{sample.role}</span>
                </span>
                <CtaLink href={`/studio?sample=${sample.id}`} size="sm" variant="paper">
                  Make it yours <ArrowRightIcon aria-hidden="true" />
                </CtaLink>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// The designer's opening section, used to show each look on the same content.
const TILE_SECTIONS = SAMPLE_PORTFOLIO.sections.filter(s => s.type === 'hero');

function themeFor(id: PresetId): ThemeSettings {
  return {
    preset: id,
    accent: null,
    fonts: 'theme',
    roundness: null,
    spacing: 'normal',
    textSize: null,
    mode: isDarkOnly(id) ? 'dark' : 'light',
  };
}

function Themes() {
  const ids = Object.keys(PRESETS) as PresetId[];
  return (
    <section id="themes" className="pl-wrap pl-section">
      <SectionHead tag="03 / Looks">One portfolio, seven looks.</SectionHead>
      <div className="pl-themes">
        {ids.map((id, i) => (
          <Reveal key={id} delay={(i % 4) * 60}>
            <div className="pl-tile">
              <Frame url={PRESETS[id].label.toLowerCase()}>
                <Miniature
                  sections={TILE_SECTIONS}
                  theme={themeFor(id)}
                  ratio={16 / 10}
                  label={`Jordan Vale's portfolio in the ${PRESETS[id].label} look`}
                />
              </Frame>
              <div className="pl-tile-name">
                <span>{PRESETS[id].label}</span>
                <span className="pl-mono">0{i + 1}</span>
              </div>
            </div>
          </Reveal>
        ))}
        <Reveal delay={240}>
          <div className="pl-own">
            <span className="pl-mono">Your own</span>
            <h3>Pick any color, font, and corner style.</h3>
            <CtaLink href="/studio" size="sm" variant="paper">
              Try it <ArrowRightIcon aria-hidden="true" />
            </CtaLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const FEATURES = [
  {title: 'Click to edit', body: 'Click any part of the page to change it.'},
  {title: 'Drag to reorder', body: 'Put your best work first.'},
  {title: 'Undo anything', body: 'Try ideas freely. Every change can be undone.'},
  {title: 'Right on phones', body: 'Every layout fits a small screen.'},
  {title: 'Your colors', body: 'No logo of ours on your page.'},
  {title: 'Your photos', body: 'Add your face and your work. Big pictures are shrunk for you.'},
];

function Features() {
  return (
    <section id="features" className="pl-wrap pl-section">
      <SectionHead tag="04 / The studio">A studio that stays out of your way.</SectionHead>
      <div className="pl-bento">
        {FEATURES.map((f, i) => (
          <article key={f.title} className="pl-cell">
            <span className="pl-mono">0{i + 1}</span>
            <div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const FAQS = [
  {q: 'Is it free?', a: `Yes, while ${BRAND} is in beta.`},
  {q: 'Do I need design or coding skills?', a: 'No. Every look works with any content.'},
  {
    q: 'How does the AI builder work?',
    a: 'You paste in your own free Gemini key from Google. The key stays in your browser, and what you type goes straight to Google, not to us. On the free plan Google may use what you send to improve its models, so leave out anything private.',
  },
  {q: 'Can I use my own domain?', a: `Not yet. Every portfolio gets a free ${PUBLIC_HOST} link.`},
];

function Faq() {
  return (
    <section id="faq" className="pl-wrap pl-section">
      <SectionHead tag="05 / Questions">Asked a lot.</SectionHead>
      <div className="pl-faq">
        {FAQS.map((f, i) => (
          <details key={f.q} open={i === 0}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="pl-final">
      <div className="pl-wrap">
        <Reveal>
          <h2 className="pl-h2">
            Your next opportunity will <span className="pl-serif">look you up.</span>
          </h2>
          <CtaLink href="/studio" size="xl">
            Build yours free <ArrowRightIcon aria-hidden="true" />
          </CtaLink>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="pl-foot">
      <div className="pl-wrap pl-foot-in pl-mono">
        <span>{BRAND} © 2026</span>
        <a href="https://astryx.atmeta.com" target="_blank" rel="noreferrer">
          Built on Astryx
        </a>
      </div>
    </footer>
  );
}

export function Landing() {
  return (
    <div className="pl">
      <a href="#main" className="pl-skip">
        Skip to content
      </a>
      <Ticker />
      <Nav />
      <main id="main">
        <Hero />
        <Stats />
        <HowItWorks />
        <Examples />
        <Themes />
        <Features />
        <Faq />
      </main>
      <FinalCta />
      <Footer />
    </div>
  );
}
