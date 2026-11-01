'use client';

import dynamic from 'next/dynamic';

const Agentation = dynamic(
  () => import('agentation').then(module => module.Agentation),
  { ssr: false },
);

export function DevTools() {
  return process.env.NODE_ENV === 'development' ? <Agentation /> : null;
}
