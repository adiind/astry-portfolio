import posthog from 'posthog-js';

// Runs in the browser before the app becomes interactive.
// Does nothing until NEXT_PUBLIC_POSTHOG_KEY is set (see .env.local).
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (key) {
  try {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      // Counts client-side route changes as pageviews, not just the first load.
      capture_pageview: 'history_change',
      person_profiles: 'identified_only',
    });
  } catch {
    // Analytics must never break the site.
  }
}
