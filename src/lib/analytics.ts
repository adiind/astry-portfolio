'use client';

import posthog from 'posthog-js';

/**
 * The sign-up funnel, in order. Each name is one PostHog event.
 * The PostHog funnel and dashboard are built from these exact names.
 */
export const FUNNEL = {
  landingViewed: 'landing_viewed',
  studioCtaClicked: 'studio_cta_clicked',
  signedIn: 'signed_in',
  studioOpened: 'studio_opened',
  portfolioEdited: 'portfolio_edited',
} as const;

type FunnelEvent = (typeof FUNNEL)[keyof typeof FUNNEL];

/** Sends one event. Does nothing when PostHog was not started (no key set). */
export function track(event: FunnelEvent, props?: Record<string, unknown>) {
  try {
    if (posthog.__loaded) posthog.capture(event, props);
  } catch {
    // Analytics must never break the site.
  }
}

/**
 * Links this browser's visits to the signed-in person, by WorkOS user id only
 * (no email or name is sent). Fires `signed_in` the first time this browser
 * sees this person, which is the moment they come back from the WorkOS screen.
 */
export function identify(userId: string) {
  try {
    if (!posthog.__loaded) return;
    if (posthog.get_distinct_id() === userId) return;
    posthog.identify(userId);
    posthog.capture(FUNNEL.signedIn);
  } catch {
    // Analytics must never break the site.
  }
}

/** Starts a fresh anonymous visitor after sign-out, so two people never merge. */
export function resetIdentity() {
  try {
    if (posthog.__loaded) posthog.reset();
  } catch {
    // Analytics must never break the site.
  }
}
