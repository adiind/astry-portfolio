'use client';

import {useEffect} from 'react';
import {useAuth} from '@workos-inc/authkit-nextjs/components';
import {FUNNEL, identify, track} from '@/lib/analytics';

/**
 * Site-wide funnel tracking that no single page owns:
 * - links the visitor to their WorkOS user once signed in
 * - records every click on a link into the studio, with where it was clicked
 */
export function AnalyticsListener() {
  const {user, loading} = useAuth();

  useEffect(() => {
    if (!loading && user) identify(user.id);
  }, [loading, user]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const link = (event.target as Element | null)?.closest?.('a[href^="/studio"]');
      if (!link) return;
      track(FUNNEL.studioCtaClicked, {
        from: window.location.pathname,
        href: link.getAttribute('href'),
        label: link.textContent?.trim().slice(0, 60) || undefined,
      });
    }
    document.addEventListener('click', onClick, {capture: true});
    return () => document.removeEventListener('click', onClick, {capture: true});
  }, []);

  return null;
}
