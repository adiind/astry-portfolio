'use client';

import Link from 'next/link';
import {AuthKitProvider} from '@workos-inc/authkit-nextjs/components';
import {Theme} from '@astryxdesign/core/theme';
import {LinkProvider} from '@astryxdesign/core/Link';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';
import {AnalyticsListener} from '@/components/AnalyticsListener';

// The editor's own chrome always uses the neutral theme.
// The portfolio preview gets its own nested <Theme> with the user's settings.
export function Providers({children}: {children: React.ReactNode}) {
  return (
    <AuthKitProvider>
      <AnalyticsListener />
      <Theme theme={neutralTheme}>
        <LinkProvider component={Link}>{children}</LinkProvider>
      </Theme>
    </AuthKitProvider>
  );
}
