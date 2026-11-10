'use client';

import dynamic from 'next/dynamic';

// The editor reads the saved draft from this browser, so it renders client-side only.
const Editor = dynamic(() => import('@/components/Editor').then(m => m.Editor), {ssr: false});

export default function StudioPage() {
  return <Editor />;
}
