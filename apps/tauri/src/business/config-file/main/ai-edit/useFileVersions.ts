import { useMemo } from 'react';
import type { AIEditVersionEntry } from './types';

export const useFileVersions = (fileId: string) => {
  const data = useMemo<AIEditVersionEntry[]>(
    () => [
      {
        id: 'current',
        label: 'Now',
        detail: 'current working copy',
        source: 'editing',
        when: 'just now',
        current: true,
      },
    ],
    [fileId],
  );

  return { data };
};
