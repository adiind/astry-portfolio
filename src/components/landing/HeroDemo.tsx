'use client';

import {useEffect, useMemo, useState} from 'react';
import {Theme} from '@astryxdesign/core/theme';
import {useMediaQuery} from '@astryxdesign/core/hooks';
import {PauseIcon, PlayIcon} from '@heroicons/react/20/solid';
import {PortfolioView} from '@/components/PortfolioView';
import {SAMPLES} from '@/lib/samples';
import {buildTheme, effectiveMode} from '@/lib/themes';
import {PUBLIC_HOST} from '@/lib/brand';

const STEP_MS = 4200;

// The full job titles do not fit side by side on a phone.
const SHORT_LABEL: Record<string, string> = {designer: 'Designer', engineer: 'Engineer', illustrator: 'Illustrator'};

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** Three finished portfolios, each in its own look, inside a chunky browser window. Flips between them on its own. */
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
    <div className="pl-demo" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className="pl-burst pl-mono">Made in the studio</div>
      <div className="pl-window">
        <div className="pl-window-bar" aria-hidden="true">
          <i />
          <i />
          <i />
          <span className="pl-window-url pl-mono">
            {PUBLIC_HOST}/{slug(sample.person)}
          </span>
        </div>
        <Theme theme={theme} mode={effectiveMode(sample.portfolio.theme)}>
          <div className="pl-window-body" role="img" aria-label={`${sample.person}'s portfolio, made with this studio`}>
            <PortfolioView sections={sample.portfolio.sections} />
          </div>
        </Theme>
      </div>
      <div className="pl-tabs" role="group" aria-label="Example portfolio">
        {SAMPLES.map(s => (
          <button
            key={s.id}
            type="button"
            className="pl-tab"
            aria-pressed={s.id === sample.id}
            onClick={() => {
              setIndex(SAMPLES.findIndex(x => x.id === s.id));
              setIsStopped(true);
            }}>
            {isNarrow ? (SHORT_LABEL[s.id] ?? s.label) : s.label}
          </button>
        ))}
        <button
          type="button"
          className="pl-tab pl-tab--icon"
          aria-label={isStopped ? 'Play examples' : 'Pause examples'}
          onClick={() => setIsStopped(s => !s)}>
          {isStopped ? <PlayIcon aria-hidden="true" /> : <PauseIcon aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
