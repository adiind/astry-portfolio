import type {Metadata} from 'next';
import {Landing} from '@/components/landing/Landing';
import {BRAND} from '@/lib/brand';

export const metadata: Metadata = {
  title: `${BRAND} · Your work deserves a better stage`,
  description: `${BRAND} turns your resume into a portfolio you're proud to send. Pick a look, change anything with a click, and share one link.`,
};

export default function Home() {
  return <Landing />;
}
