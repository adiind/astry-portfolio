import type {Metadata} from 'next';
import './globals.css';
import {Providers} from './providers';

export const metadata: Metadata = {
  title: 'Plinth studio',
  description: 'Build a portfolio and restyle it live with Astryx themes.',
};

// Extra fonts for the theme panel's font pairings. Preset fonts load in globals.css.
const FONTS_URL =
  'https://fonts.googleapis.com/css2?' +
  [
    'Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700',
    'DM+Sans:wght@400;500;600;700',
    'JetBrains+Mono:wght@400;500;600;700',
    'Inter:wght@400;500;600;700',
    'Playfair+Display:wght@400;600;700',
    'Source+Sans+3:wght@400;600;700',
    'Space+Grotesk:wght@400;500;600;700',
  ]
    .map(f => `family=${f}`)
    .join('&') +
  '&display=swap';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS_URL} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
