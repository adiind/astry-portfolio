'use client';

import type {CSSProperties, MouseEvent} from 'react';
import {VStack, HStack} from '@astryxdesign/core/Layout';
import {Text, Heading} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {Avatar} from '@astryxdesign/core/Avatar';
import {Card} from '@astryxdesign/core/Card';
import {Center} from '@astryxdesign/core/Center';
import {Grid} from '@astryxdesign/core/Grid';
import {AspectRatio} from '@astryxdesign/core/AspectRatio';
import {Icon} from '@astryxdesign/core/Icon';
import {ArrowRightIcon, ArrowTopRightOnSquareIcon, EnvelopeIcon, PhotoIcon} from '@heroicons/react/20/solid';
import {useImageSrc} from '@/lib/imageStore';
import type {
  AboutSection,
  ContactSection,
  ExperienceSection,
  GallerySection,
  HeroSection,
  ImageRef,
  PortfolioSection,
  Project,
  ProjectsSection,
  StatsSection,
  TestimonialsSection,
  TextSection,
} from '@/lib/portfolio';

// The page paints the theme's own body color, so dark mode and warm themes
// fill the whole preview instead of only the components.
const pageStyle: CSSProperties = {
  backgroundColor: 'var(--color-background-body)',
  color: 'var(--color-text-primary)',
  minHeight: '100%',
};

function initials(text: string) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

const imgStyle: CSSProperties = {display: 'block', width: '100%', height: '100%', objectFit: 'cover'};
const naturalImgStyle: CSSProperties = {display: 'block', width: '100%', height: 'auto'};
const frameStyle = (ratio: number | undefined, radius: string): CSSProperties => ({
  width: '100%',
  aspectRatio: ratio,
  overflow: 'hidden',
  borderRadius: radius,
  backgroundColor: 'var(--color-background-muted)',
});

/**
 * One picture in a rounded frame. Pass `ratio` to crop it to a shape, or leave
 * it out to show the whole picture at its own shape.
 */
function Photo({
  src,
  alt,
  ratio,
  radius = 'var(--radius-container)',
}: {
  src: ImageRef;
  alt: string;
  ratio?: number;
  radius?: string;
}) {
  const url = useImageSrc(src);
  return (
    <div style={frameStyle(ratio, radius)}>
      {url && (
        // A plain <img>: uploads are local blob URLs, which next/image cannot optimise.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} loading="lazy" decoding="async" style={ratio ? imgStyle : naturalImgStyle} />
      )}
    </div>
  );
}

/** A person's small round picture. Falls back to their initials. */
function Face({name, src, size}: {name: string; src: ImageRef; size: 36 | 40 | 96}) {
  const url = useImageSrc(src);
  return <Avatar name={name} src={url ?? undefined} alt={url ? name : undefined} size={size} />;
}

// The words shrink before the row wraps, so the photo stays beside them on
// anything wider than a phone.
const heroTextStyle: CSSProperties = {flex: '1 1 320px', minWidth: 0, maxWidth: 560};
const heroPhotoStyle: CSSProperties = {flex: '0 1 340px', minWidth: 220};
const heroFaceStyle: CSSProperties = {width: 128};

function Hero({s}: {s: HeroSection}) {
  const buttons = (
    <HStack gap={3} wrap="wrap" hAlign={s.layout === 'centered' ? 'center' : 'start'}>
      {s.primaryLabel && (
        <Button
          label={s.primaryLabel}
          variant="primary"
          endContent={<Icon icon={ArrowRightIcon} size="sm" color="inherit" />}
        />
      )}
      {s.secondaryLabel && <Button label={s.secondaryLabel} variant="secondary" />}
    </HStack>
  );

  if (s.layout === 'split') {
    return (
      <HStack gap={8} vAlign="center" hAlign="between" paddingBlock={8} wrap="wrap-reverse">
        <VStack gap={5} style={heroTextStyle}>
          <VStack gap={3}>
            <Text type="label" color="secondary">
              {s.name}
            </Text>
            <Heading level={1} type="display-2" textWrap="balance">
              {s.headline}
            </Heading>
            <Text type="large" color="secondary" textWrap="pretty">
              {s.intro}
            </Text>
          </VStack>
          {buttons}
        </VStack>
        {s.photo ? (
          <div style={heroPhotoStyle}>
            <Photo src={s.photo} alt={s.name} ratio={4 / 5} />
          </div>
        ) : (
          <Avatar name={s.name} size={180} shape="rounded" />
        )}
      </HStack>
    );
  }

  return (
    <VStack gap={6} hAlign="center" paddingBlock={8}>
      {s.photo ? (
        <div style={heroFaceStyle}>
          <Photo src={s.photo} alt={s.name} ratio={1} radius="var(--radius-full)" />
        </div>
      ) : (
        <Avatar name={s.name} size={96} />
      )}
      <VStack gap={3} hAlign="center">
        <Text type="label" color="secondary" justify="center">
          {s.name}
        </Text>
        <Heading level={1} type="display-2" justify="center" textWrap="balance">
          {s.headline}
        </Heading>
        <Text type="large" color="secondary" justify="center" textWrap="balance">
          {s.intro}
        </Text>
      </VStack>
      {buttons}
    </VStack>
  );
}

function Skills({skills}: {skills: string[]}) {
  if (skills.length === 0) return null;
  return (
    <Text type="body" color="secondary">
      {skills.join(' · ')}
    </Text>
  );
}

function About({s}: {s: AboutSection}) {
  if (s.layout === 'split') {
    return (
      <Grid columns={{minWidth: 260, repeat: 'fit'}} gap={8}>
        <VStack gap={4}>
          {s.heading && <Heading level={2}>{s.heading}</Heading>}
          {s.photo && <Photo src={s.photo} alt={s.heading} ratio={1} />}
        </VStack>
        <VStack gap={4}>
          <Text type="large" textWrap="pretty">
            {s.body}
          </Text>
          <Skills skills={s.skills} />
        </VStack>
      </Grid>
    );
  }
  return (
    <VStack gap={4}>
      {s.heading && <Heading level={2}>{s.heading}</Heading>}
      {s.photo && <Photo src={s.photo} alt={s.heading} ratio={16 / 7} />}
      <Text type="large" textWrap="pretty">
        {s.body}
      </Text>
      <Skills skills={s.skills} />
    </VStack>
  );
}

function ProjectCover({p}: {p: Project}) {
  if (p.image) return <Photo src={p.image} alt={`${p.title} cover`} ratio={16 / 10} />;
  return (
    <Card variant="muted" padding={0} elevation="none">
      <AspectRatio ratio={16 / 10}>
        <Center height="100%">
          <Heading level={3} type="display-3">
            {initials(p.title)}
          </Heading>
        </Center>
      </AspectRatio>
    </Card>
  );
}

function ProjectText({p}: {p: Project}) {
  return (
    <VStack gap={2}>
      <Heading level={3}>{p.title}</Heading>
      <Text type="body" color="secondary">
        {p.description}
      </Text>
      {p.tags.length > 0 && (
        <Text type="supporting" color="secondary">
          {p.tags.join(' · ')}
        </Text>
      )}
      {p.url && (
        <HStack gap={0}>
          <Button
            label="View project"
            variant="ghost"
            size="sm"
            href={p.url}
            target="_blank"
            rel="noreferrer"
            endContent={<Icon icon={ArrowTopRightOnSquareIcon} size="sm" color="inherit" />}
          />
        </HStack>
      )}
    </VStack>
  );
}

function Projects({s}: {s: ProjectsSection}) {
  return (
    <VStack gap={4}>
      {s.heading && <Heading level={2}>{s.heading}</Heading>}
      {s.layout === 'list' ? (
        <VStack gap={6}>
          {s.items.map(p => (
            <Grid key={p.id} columns={{minWidth: 220, repeat: 'fit'}} gap={6} align="center">
              <ProjectCover p={p} />
              <ProjectText p={p} />
            </Grid>
          ))}
        </VStack>
      ) : (
        <Grid columns={{minWidth: 220, repeat: 'fit'}} gap={4}>
          {s.items.map(p => (
            <VStack key={p.id} gap={4}>
              <ProjectCover p={p} />
              <ProjectText p={p} />
            </VStack>
          ))}
        </Grid>
      )}
    </VStack>
  );
}

const mosaicStyle: CSSProperties = {columns: '3 220px', columnGap: 'var(--spacing-4)'};
const mosaicItemStyle: CSSProperties = {breakInside: 'avoid', marginBottom: 'var(--spacing-4)'};

/** An empty picture slot, so a new gallery shows where photos will go. */
function EmptyShot({ratio}: {ratio: number}) {
  return (
    <Card variant="muted" padding={0} elevation="none">
      <AspectRatio ratio={ratio}>
        <Center height="100%">
          <Icon icon={PhotoIcon} color="secondary" />
        </Center>
      </AspectRatio>
    </Card>
  );
}

function Gallery({s}: {s: GallerySection}) {
  const caption = (text: string) =>
    text ? (
      <Text type="supporting" color="secondary">
        {text}
      </Text>
    ) : null;
  return (
    <VStack gap={4}>
      {s.heading && <Heading level={2}>{s.heading}</Heading>}
      {s.layout === 'mosaic' ? (
        <div style={mosaicStyle}>
          {s.items.map(shot => (
            <div key={shot.id} style={mosaicItemStyle}>
              <VStack gap={2}>
                {shot.image ? (
                  <Photo src={shot.image} alt={shot.caption || 'Gallery picture'} />
                ) : (
                  <EmptyShot ratio={4 / 5} />
                )}
                {caption(shot.caption)}
              </VStack>
            </div>
          ))}
        </div>
      ) : (
        <Grid columns={{minWidth: 200, repeat: 'fit'}} gap={4}>
          {s.items.map(shot => (
            <VStack key={shot.id} gap={2}>
              {shot.image ? (
                <Photo src={shot.image} alt={shot.caption || 'Gallery picture'} ratio={4 / 3} />
              ) : (
                <EmptyShot ratio={4 / 3} />
              )}
              {caption(shot.caption)}
            </VStack>
          ))}
        </Grid>
      )}
    </VStack>
  );
}

function Experience({s}: {s: ExperienceSection}) {
  if (s.layout === 'cards') {
    return (
      <VStack gap={4}>
        {s.heading && <Heading level={2}>{s.heading}</Heading>}
        <Grid columns={{minWidth: 220, repeat: 'fit'}} gap={4}>
          {s.items.map(job => (
            <Card key={job.id} padding={5} variant="muted" elevation="none">
              <VStack gap={2}>
                <Text type="supporting" color="secondary" hasTabularNumbers>
                  {job.period}
                </Text>
                <Heading level={3}>{job.role}</Heading>
                <Text type="label" color="secondary">
                  {job.company}
                </Text>
                <Text type="body">{job.summary}</Text>
              </VStack>
            </Card>
          ))}
        </Grid>
      </VStack>
    );
  }
  return (
    <VStack gap={4}>
      {s.heading && <Heading level={2}>{s.heading}</Heading>}
      <VStack gap={0}>
        {s.items.map(job => (
          <VStack key={job.id} gap={0}>
            <HStack gap={4} hAlign="between" vAlign="start" paddingBlock={4} wrap="wrap">
              <VStack gap={1}>
                <Text type="label" weight="semibold">
                  {job.role} · {job.company}
                </Text>
                <Text type="body" color="secondary">
                  {job.summary}
                </Text>
              </VStack>
              <Text type="supporting" color="secondary" hasTabularNumbers>
                {job.period}
              </Text>
            </HStack>
          </VStack>
        ))}
      </VStack>
    </VStack>
  );
}

function Testimonials({s}: {s: TestimonialsSection}) {
  if (s.layout === 'spotlight') {
    return (
      <VStack gap={8} hAlign="center">
        {s.heading && (
          <Heading level={2} justify="center">
            {s.heading}
          </Heading>
        )}
        {s.items.map(q => (
          <VStack key={q.id} gap={4} hAlign="center" maxWidth={680}>
            <Heading level={3} type="display-3" weight="normal" justify="center" textWrap="balance">
              “{q.quote}”
            </Heading>
            <HStack gap={3} vAlign="center">
              <Face name={q.author} src={q.avatar} size={40} />
              <VStack gap={0}>
                <Text type="label" weight="semibold">
                  {q.author}
                </Text>
                <Text type="supporting" color="secondary">
                  {q.role}
                </Text>
              </VStack>
            </HStack>
          </VStack>
        ))}
      </VStack>
    );
  }
  return (
    <VStack gap={4}>
      {s.heading && <Heading level={2}>{s.heading}</Heading>}
      <Grid columns={{minWidth: 260, repeat: 'fit'}} gap={4}>
        {s.items.map(q => (
          <Card key={q.id} padding={5} variant="muted">
            <VStack gap={4}>
              <Text type="large" textWrap="pretty">
                “{q.quote}”
              </Text>
              <HStack gap={3} vAlign="center">
                <Face name={q.author} src={q.avatar} size={36} />
                <VStack gap={0}>
                  <Text type="label" weight="semibold">
                    {q.author}
                  </Text>
                  <Text type="supporting" color="secondary">
                    {q.role}
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </Card>
        ))}
      </Grid>
    </VStack>
  );
}

function Stats({s}: {s: StatsSection}) {
  const isCards = s.layout === 'cards';
  return (
    <VStack gap={4}>
      {s.heading && <Heading level={2}>{s.heading}</Heading>}
      <Grid columns={{minWidth: 160, repeat: 'fit'}} gap={4}>
        {s.items.map(stat => {
          const body = (
            <VStack gap={1}>
              <Heading level={3} type="display-2" color="accent">
                {stat.value}
              </Heading>
              <Text type="body" color="secondary">
                {stat.label}
              </Text>
            </VStack>
          );
          return isCards ? (
            <Card key={stat.id} padding={5} variant="muted">
              {body}
            </Card>
          ) : (
            <VStack key={stat.id}>{body}</VStack>
          );
        })}
      </Grid>
    </VStack>
  );
}

function TextBlock({s}: {s: TextSection}) {
  const isCentered = s.layout === 'centered';
  return (
    <VStack gap={3} hAlign={isCentered ? 'center' : 'start'}>
      {s.heading && (
        <Heading level={2} justify={isCentered ? 'center' : 'start'}>
          {s.heading}
        </Heading>
      )}
      <Text type="large" textWrap="pretty" justify={isCentered ? 'center' : 'start'}>
        {s.body}
      </Text>
    </VStack>
  );
}

function Contact({s}: {s: ContactSection}) {
  const isCard = s.layout === 'card';
  const inner = (
    <VStack gap={4} hAlign={isCard ? 'center' : 'start'}>
      {s.heading && (
        <Heading level={2} justify={isCard ? 'center' : 'start'}>
          {s.heading}
        </Heading>
      )}
      <Text type="large" color="secondary" justify={isCard ? 'center' : 'start'} textWrap="balance">
        {s.body}
      </Text>
      <HStack gap={3} wrap="wrap" hAlign={isCard ? 'center' : 'start'}>
        {s.email && (
          <Button
            label={s.email}
            variant="primary"
            href={`mailto:${s.email}`}
            icon={<Icon icon={EnvelopeIcon} size="sm" color="inherit" />}
          />
        )}
        {s.links.map(l => (
          <Button key={l.id} label={l.label} variant="secondary" href={l.url} target="_blank" rel="noreferrer" />
        ))}
      </HStack>
    </VStack>
  );
  return isCard ? (
    <Card padding={8} variant="muted">
      {inner}
    </Card>
  ) : (
    inner
  );
}

export function SectionView({section}: {section: PortfolioSection}) {
  switch (section.type) {
    case 'hero':
      return <Hero s={section} />;
    case 'about':
      return <About s={section} />;
    case 'projects':
      return <Projects s={section} />;
    case 'gallery':
      return <Gallery s={section} />;
    case 'experience':
      return <Experience s={section} />;
    case 'testimonials':
      return <Testimonials s={section} />;
    case 'stats':
      return <Stats s={section} />;
    case 'text':
      return <TextBlock s={section} />;
    case 'contact':
      return <Contact s={section} />;
  }
}

// In the editor, each section is a click target with a ring when selected.
const editableStyle = (isSelected: boolean): CSSProperties => ({
  cursor: 'pointer',
  borderRadius: 'var(--radius-container)',
  outline: isSelected ? '2px solid var(--color-accent)' : '1px dashed transparent',
  outlineOffset: 12,
});

/**
 * Renders a whole portfolio. In the editor, pass `onSelectSection` to make
 * sections clickable; links and buttons inside then stop navigating.
 */
export function PortfolioView({
  sections,
  selectedId,
  onSelectSection,
}: {
  sections: PortfolioSection[];
  selectedId?: string | null;
  onSelectSection?: (id: string) => void;
}) {
  const visible = sections.filter(s => !s.isHidden);
  return (
    <VStack gap={0} hAlign="center" style={pageStyle}>
      <VStack gap={10} paddingInline={6} paddingBlock={8} maxWidth={960} width="100%">
        {visible.map(s =>
          onSelectSection ? (
            <section
              key={s.id}
              aria-label={`Edit ${s.type} section`}
              data-section-id={s.id}
              style={editableStyle(s.id === selectedId)}
              onClickCapture={(e: MouseEvent) => {
                // Inside the editor, a click picks the section instead of following a link.
                e.preventDefault();
                onSelectSection(s.id);
              }}>
              <SectionView section={s} />
            </section>
          ) : (
            <SectionView key={s.id} section={s} />
          ),
        )}
      </VStack>
    </VStack>
  );
}
