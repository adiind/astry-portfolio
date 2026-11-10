'use client';

import {useMemo, type CSSProperties} from 'react';
import {Theme} from '@astryxdesign/core/theme';
import {PortfolioView} from '@/components/PortfolioView';
import type {PortfolioSection} from '@/lib/portfolio';
import {buildTheme, effectiveMode, type ThemeSettings} from '@/lib/themes';

// The portfolio is drawn at a normal desktop width, then shrunk to fit its
// frame, like a photo of the page. So the small version is the real thing,
// not a mock-up.
const PAGE_WIDTH = 1040;

const pageStyle: CSSProperties = {
  width: PAGE_WIDTH,
  // How much to shrink: the frame's width divided by the page's width.
  // `100cqw` is the frame's width. CSS can't divide one length by another
  // directly, so tan(atan2(a, b)) is the standard way to get a / b as a plain
  // number. Done in CSS so the size is right on the very first paint.
  transform: `scale(tan(atan2(100cqw, ${PAGE_WIDTH}px)))`,
  transformOrigin: 'top left',
  pointerEvents: 'none',
};

/** A small, look-only picture of a real portfolio. */
export function Miniature({
  sections,
  theme,
  ratio,
  label,
}: {
  sections: PortfolioSection[];
  theme: ThemeSettings;
  /** Frame shape, width divided by height. */
  ratio: number;
  /** Read out by screen readers in place of the page inside. */
  label: string;
}) {
  const built = useMemo(() => buildTheme(theme), [theme]);
  const frameStyle: CSSProperties = {
    aspectRatio: String(ratio),
    overflow: 'hidden',
    width: '100%',
    // Lets the page inside measure this frame (the `cqw` unit above).
    containerType: 'inline-size',
    // Painted in the look's own page colour, so a page shorter than the frame
    // doesn't leave a strip of the site showing underneath.
    backgroundColor: 'var(--color-background-body)',
  };

  return (
    <Theme theme={built} mode={effectiveMode(theme)}>
      <div role="img" aria-label={label} style={frameStyle}>
        {/* inert: the buttons inside the picture can't be clicked or tabbed to. */}
        <div style={pageStyle} inert>
          <PortfolioView sections={sections} />
        </div>
      </div>
    </Theme>
  );
}
