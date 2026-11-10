'use client';

import {useAuth} from '@workos-inc/authkit-nextjs/components';
import {useEffect, useRef, type CSSProperties, type ReactNode} from 'react';
import {VStack, HStack} from '@astryxdesign/core/Layout';
import {Text, Heading} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Grid} from '@astryxdesign/core/Grid';
import {Icon} from '@astryxdesign/core/Icon';
import {Collapsible} from '@astryxdesign/core/Collapsible';
import {Theme} from '@astryxdesign/core/theme';
import {useMediaQuery} from '@astryxdesign/core/hooks';
import {ArrowRightIcon} from '@heroicons/react/20/solid';
import {HeroDemo} from './HeroDemo';
import {Miniature} from './Miniature';
import {PRESETS, SITE_THEME, isDarkOnly, type PresetId, type ThemeSettings} from '@/lib/themes';
import {SAMPLES, SAMPLE_PORTFOLIO} from '@/lib/samples';
import {BRAND, PUBLIC_HOST} from '@/lib/brand';

// Page-level styles. Astryx has no prop for marketing-size headlines.
const pageStyle: CSSProperties = {
  backgroundColor: 'var(--color-background-body)',
  color: 'var(--color-text-primary)',
  minHeight: '100dvh',
  overflowX: 'clip',
};
const navStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  backgroundColor: 'var(--color-background-body)',
};
const displayStyle: CSSProperties = {fontSize: 'clamp(2.75rem, 7vw, 5.25rem)', lineHeight: 1.05};
const sectionTitleStyle: CSSProperties = {fontSize: 'clamp(2rem, 4.5vw, 3rem)', lineHeight: 1.1};
const centered: CSSProperties = {marginInline: 'auto'};
const anchorOffset: CSSProperties = {scrollMarginTop: 80};

const CONTENT_WIDTH = 1120;

// Content renders visible (server HTML, slow JS, and above-the-fold stay instant).
// Only things that start below the fold get hidden, then fade up when scrolled to.
function Reveal({children, delay = 0}: {children: ReactNode; delay?: number}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.style.transition = `opacity 600ms ease ${delay}ms, transform 600ms cubic-bezier(.2,.7,.2,1) ${delay}ms`;
        el.style.opacity = '1';
        el.style.transform = 'none';
        io.disconnect();
      },
      {rootMargin: '0px 0px -10% 0px'},
    );
    io.observe(el);
    return () => io.disconnect();
  }, [prefersReducedMotion, delay]);

  return <div ref={ref}>{children}</div>;
}

function Section({id, width = CONTENT_WIDTH, children}: {id?: string; width?: number; children: ReactNode}) {
  return (
    <VStack
      id={id}
      gap={10}
      hAlign="center"
      paddingInline={6}
      paddingBlock={10}
      maxWidth={width}
      width="100%"
      style={{...centered, ...anchorOffset}}>
      {children}
    </VStack>
  );
}

function SectionTitle({children}: {children: ReactNode}) {
  return (
    <Reveal>
      <VStack maxWidth={720}>
        <Heading level={2} justify="center" textWrap="balance" style={sectionTitleStyle}>
          {children}
        </Heading>
      </VStack>
    </Reveal>
  );
}

function Nav({isNarrow}: {isNarrow: boolean}) {
  const {user, loading} = useAuth();
  return (
    <div style={navStyle}>
      <HStack
        gap={4}
        hAlign="between"
        vAlign="center"
        paddingInline={6}
        paddingBlock={3}
        maxWidth={CONTENT_WIDTH + 48}
        width="100%"
        style={centered}>
        <Heading level={3} weight="bold">
          {BRAND}
        </Heading>
        {!isNarrow && (
          <HStack gap={1}>
            <Button label="How it works" variant="ghost" size="sm" href="#how" />
            <Button label="Examples" variant="ghost" size="sm" href="#examples" />
            <Button label="Themes" variant="ghost" size="sm" href="#themes" />
            <Button label="FAQ" variant="ghost" size="sm" href="#faq" />
          </HStack>
        )}
        <HStack gap={2} vAlign="center">
          {!loading && !user && <Button label="Sign in" variant="ghost" size="sm" href="/sign-in" as="a" />}
          <Button label="Open the studio" variant="primary" size="sm" href="/studio" as="a" />
        </HStack>
      </HStack>
    </div>
  );
}

function Hero() {
  return (
    <VStack
      gap={10}
      hAlign="center"
      paddingInline={6}
      paddingBlockStart={10}
      paddingBlockEnd={8}
      maxWidth={CONTENT_WIDTH}
      width="100%"
      style={centered}>
      <VStack gap={6} hAlign="center" maxWidth={860}>
        <Heading level={1} justify="center" textWrap="balance" style={displayStyle}>
          Your work deserves a better stage
        </Heading>
        <VStack maxWidth={560}>
          <Text type="large" color="secondary" justify="center" textWrap="balance">
            A portfolio you&apos;re proud to send. Tell the AI builder about your work, add your
            photos, pick a look.
          </Text>
        </VStack>
        <HStack gap={3} wrap="wrap" hAlign="center">
          <Button
            label="Build yours free"
            variant="primary"
            size="lg"
            href="/studio" as="a"
            endContent={<Icon icon={ArrowRightIcon} size="sm" color="inherit" />}
          />
          <Button label="See how it works" variant="secondary" size="lg" href="#how" />
        </HStack>
      </VStack>
      <HeroDemo />
    </VStack>
  );
}

function Proof() {
  const facts = [
    {value: '7', label: 'themes'},
    {value: '9', label: 'section types'},
    {value: '18', label: 'layouts'},
    {value: '1', label: 'link to share'},
  ];
  return (
    <VStack paddingInline={6} paddingBlock={8} maxWidth={CONTENT_WIDTH} width="100%" style={centered}>
      <Grid columns={{minWidth: 140, repeat: 'fit'}} gap={6}>
        {facts.map(f => (
          <VStack key={f.label} gap={1} hAlign="center">
            <Heading level={3} type="display-2" justify="center">
              {f.value}
            </Heading>
            <Text type="body" color="secondary" justify="center">
              {f.label}
            </Text>
          </VStack>
        ))}
      </Grid>
    </VStack>
  );
}

const STEPS = [
  {title: 'Describe yourself', body: 'Tell the AI builder what you do. It drafts every section.'},
  {title: 'Add your photos', body: 'Your face, your work, your desk. Click a slot and pick a file.'},
  {title: 'Pick a look and share', body: `Publish to your own ${PUBLIC_HOST} link.`},
];

function HowItWorks() {
  return (
    <Section id="how">
      <SectionTitle>Blank page to finished in three steps</SectionTitle>
      <Grid columns={{minWidth: 240, repeat: 'fit'}} gap={8} width="100%">
        {STEPS.map((s, i) => (
          <Reveal key={s.title} delay={i * 100}>
            <VStack gap={2} hAlign="center">
              <Heading level={3} justify="center">
                {s.title}
              </Heading>
              <Text type="body" color="secondary" justify="center">
                {s.body}
              </Text>
            </VStack>
          </Reveal>
        ))}
      </Grid>
    </Section>
  );
}

const exampleFrameStyle: CSSProperties = {overflow: 'hidden'};

function Examples() {
  return (
    <Section id="examples">
      <SectionTitle>Start from one that is already finished</SectionTitle>
      <Text type="supporting" color="secondary">Fictional examples; Noor and Theo have AI-generated portraits.</Text>
      <Grid columns={{minWidth: 280, repeat: 'fit'}} gap={6} width="100%">
        {SAMPLES.map((sample, i) => (
          <Reveal key={sample.id} delay={i * 100}>
            <VStack gap={3}>
              <Card padding={0} elevation="med" style={exampleFrameStyle}>
                <Miniature
                  sections={sample.portfolio.sections}
                  theme={sample.portfolio.theme}
                  ratio={3 / 4}
                  label={`${sample.person}'s finished portfolio`}
                />
              </Card>
              <HStack gap={2} hAlign="between" vAlign="center" wrap="wrap">
                <VStack gap={0}>
                  <Text type="label" weight="semibold">
                    {sample.person}
                  </Text>
                  <Text type="supporting" color="secondary">
                    {sample.role}
                  </Text>
                </VStack>
                <Button
                  label="Make it yours"
                  variant="secondary"
                  size="sm"
                  href={`/studio?sample=${sample.id}`} as="a"
                  endContent={<Icon icon={ArrowRightIcon} size="sm" color="inherit" />}
                />
              </HStack>
            </VStack>
          </Reveal>
        ))}
      </Grid>
    </Section>
  );
}

// The designer's opening section, used to show each look on the same content.
const TILE_SECTIONS = SAMPLE_PORTFOLIO.sections.filter(s => s.type === 'hero');
const tileFrameStyle: CSSProperties = {overflow: 'hidden'};

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

function ThemeTile({id, delay}: {id: PresetId; delay: number}) {
  return (
    <Reveal delay={delay}>
      <VStack gap={2}>
        <Card padding={0} elevation="none" style={tileFrameStyle}>
          <Miniature
            sections={TILE_SECTIONS}
            theme={themeFor(id)}
            ratio={16 / 10}
            label={`Jordan Vale's portfolio in the ${PRESETS[id].label} look`}
          />
        </Card>
        <Text type="label" weight="semibold">
          {PRESETS[id].label}
        </Text>
      </VStack>
    </Reveal>
  );
}

function Themes() {
  const ids = Object.keys(PRESETS) as PresetId[];
  return (
    <Section id="themes">
      <SectionTitle>One portfolio, seven looks</SectionTitle>
      <Grid columns={{minWidth: 240, repeat: 'fit'}} gap={6} width="100%">
        {ids.map((id, i) => (
          <ThemeTile key={id} id={id} delay={i * 60} />
        ))}
        <Reveal delay={ids.length * 60}>
          <VStack gap={4} padding={4}>
            <Text type="supporting" color="secondary">
              Your own
            </Text>
            <Heading level={3}>Pick any color, font, and corner style</Heading>
            <HStack gap={0}>
              <Button
                label="Try it"
                variant="ghost"
                size="sm"
                href="/studio" as="a"
                endContent={<Icon icon={ArrowRightIcon} size="sm" color="inherit" />}
              />
            </HStack>
          </VStack>
        </Reveal>
      </Grid>
    </Section>
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
    <Section id="features">
      <SectionTitle>A studio that stays out of your way</SectionTitle>
      <Grid columns={{minWidth: 260, repeat: 'fit'}} gap={8} width="100%">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 80}>
            <VStack gap={2}>
              <Heading level={3}>{f.title}</Heading>
              <Text type="body" color="secondary">
                {f.body}
              </Text>
            </VStack>
          </Reveal>
        ))}
      </Grid>
    </Section>
  );
}

const FAQS = [
  {q: 'Is it free?', a: `Yes, while ${BRAND} is in beta.`},
  {q: 'Do I need design or coding skills?', a: 'No. Every theme looks good with any content.'},
  {
    q: 'How does the AI builder work?',
    a: 'You paste in your own free Gemini key from Google. The key stays in your browser, and what you type goes straight to Google, not to us. On the free plan Google may use what you send to improve its models, so leave out anything private.',
  },
  {q: 'Can I use my own domain?', a: `Not yet. Every portfolio gets a free ${PUBLIC_HOST} link.`},
];

function Faq() {
  return (
    <Section id="faq" width={760}>
      <SectionTitle>Questions</SectionTitle>
      <VStack gap={6} width="100%">
        {FAQS.map((f, i) => (
          <Collapsible
            key={f.q}
            trigger={
              <Text type="large" weight="semibold">
                {f.q}
              </Text>
            }
            chevronPosition="end"
            defaultIsOpen={i === 0}>
            <VStack paddingBlockStart={2}>
              <Text type="body" color="secondary">
                {f.a}
              </Text>
            </VStack>
          </Collapsible>
        ))}
      </VStack>
    </Section>
  );
}

function FinalCta() {
  return (
    <Section>
      <Reveal>
        <VStack gap={8} hAlign="center" maxWidth={760}>
          <Heading level={2} justify="center" textWrap="balance" style={sectionTitleStyle}>
            Your next opportunity will look you up
          </Heading>
          <Button
            label="Build yours free"
            variant="primary"
            size="lg"
            href="/studio" as="a"
            endContent={<Icon icon={ArrowRightIcon} size="sm" color="inherit" />}
          />
        </VStack>
      </Reveal>
    </Section>
  );
}

function Footer() {
  return (
    <HStack
      gap={4}
      hAlign="between"
      vAlign="center"
      paddingInline={6}
      paddingBlock={8}
      maxWidth={CONTENT_WIDTH}
      width="100%"
      wrap="wrap"
      style={centered}>
      <Text type="supporting" color="secondary">
        {BRAND} © 2026
      </Text>
      <Button
        label="Built on Astryx"
        variant="ghost"
        size="sm"
        href="https://astryx.atmeta.com"
        target="_blank"
        rel="noreferrer"
      />
    </HStack>
  );
}

export function Landing() {
  const isNarrow = useMediaQuery('(max-width: 760px)');
  return (
    <Theme theme={SITE_THEME}>
      <main style={pageStyle}>
        <Nav isNarrow={isNarrow} />
        <Hero />
        <Proof />
        <HowItWorks />
        <Examples />
        <Themes />
        <Features />
        <Faq />
        <FinalCta />
        <Footer />
      </main>
    </Theme>
  );
}
