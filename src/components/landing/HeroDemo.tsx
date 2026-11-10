'use client';

import {useEffect, useMemo, useState, type CSSProperties} from 'react';
import {VStack, HStack} from '@astryxdesign/core/Layout';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Icon} from '@astryxdesign/core/Icon';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Theme} from '@astryxdesign/core/theme';
import {useMediaQuery} from '@astryxdesign/core/hooks';
import {PauseIcon, PlayIcon} from '@heroicons/react/20/solid';
import {PortfolioView} from '@/components/PortfolioView';
import {SAMPLES} from '@/lib/samples';
import {buildTheme, effectiveMode} from '@/lib/themes';

const STEP_MS = 4200;

// The full job titles do not fit side by side on a phone.
const SHORT_LABEL: Record<string, string> = {designer: 'Designer', engineer: 'Engineer', illustrator: 'Illustrator'};

// A fixed-height window onto the portfolio, so the page doesn't jump between people.
const viewportStyle: CSSProperties = {height: 560, overflow: 'hidden'};
const frameStyle: CSSProperties = {overflow: 'hidden'};
// Without this the demo grows as wide as the portfolio's widest word and pokes out of a phone screen.
const wrapStyle: CSSProperties = {width: '100%', minWidth: 0};

/** Three finished portfolios, each in its own look. Flips between them on its own. */
export function HeroDemo() {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isNarrow = useMediaQuery('(max-width: 520px)');
  const isPlaying = !isStopped && !isHovered && !prefersReducedMotion;

  useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => setIndex(i => (i + 1) % SAMPLES.length), STEP_MS);
    return () => clearInterval(t);
  }, [isPlaying]);

  const sample = SAMPLES[index];
  const theme = useMemo(() => buildTheme(sample.portfolio.theme), [sample]);

  return (
    <div style={wrapStyle} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <VStack gap={4} hAlign="center" width="100%">
        <Card padding={0} variant="transparent" elevation="high" width="100%" maxWidth={960} style={frameStyle}>
          <Theme theme={theme} mode={effectiveMode(sample.portfolio.theme)}>
            <div style={viewportStyle} aria-label={`${sample.person}'s portfolio, made with this studio`}>
              <PortfolioView sections={sample.portfolio.sections} />
            </div>
          </Theme>
        </Card>
        <HStack gap={2} vAlign="center" hAlign="center" wrap="wrap">
          <SegmentedControl
            label="Example portfolio"
            value={sample.id}
            onChange={id => {
              setIndex(SAMPLES.findIndex(s => s.id === id));
              setIsStopped(true);
            }}>
            {SAMPLES.map(s => (
              <SegmentedControlItem key={s.id} value={s.id} label={isNarrow ? (SHORT_LABEL[s.id] ?? s.label) : s.label} />
            ))}
          </SegmentedControl>
          <Button
            label={isStopped ? 'Play examples' : 'Pause examples'}
            size="sm"
            variant="ghost"
            isIconOnly
            icon={<Icon icon={isStopped ? PlayIcon : PauseIcon} size="sm" />}
            onClick={() => setIsStopped(s => !s)}
          />
        </HStack>
      </VStack>
    </div>
  );
}
