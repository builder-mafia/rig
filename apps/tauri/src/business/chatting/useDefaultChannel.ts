'use client';

import { useEffect, useState } from 'react';
import { createChannel, getChannels } from './storage/tauriStorageClient';
import type { StorageChannel } from './storage/types';

const DEFAULT_CHANNEL_ID = 'default';

export function useDefaultChannel() {
  const [channel, setChannel] = useState<StorageChannel | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const channels = await getChannels();
        if (cancelled) return;

        if (channels.length > 0) {
          setChannel(channels[0]);
          return;
        }

        const now = Date.now();
        const newChannel: StorageChannel = {
          id: DEFAULT_CHANNEL_ID,
          agentId: 'default',
          title: null,
          description: null,
          pin: null,
          createdAt: now,
          updatedAt: now,
        };

        await createChannel(newChannel);
        if (cancelled) return;
        setChannel(newChannel);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    channel,
    error,
  };
}
