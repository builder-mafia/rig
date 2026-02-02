'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { ChannelState } from './ChannelState';
import type { StorageChannel } from './storage/types';

const channelState = ChannelState.getInstance();

export function useChannelState() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    channelState
      .initialize()
      .then(() => setInitialized(true))
      .catch(e => setError(e instanceof Error ? e : new Error(String(e))));
  }, []);

  const subscribeToChannels = useCallback((onChange: () => void) => {
    const sub = channelState.getChannels$().subscribe(onChange);
    return () => sub.unsubscribe();
  }, []);

  const getChannels = useCallback(() => channelState.getChannels(), []);

  const subscribeToSelectedId = useCallback((onChange: () => void) => {
    const sub = channelState.getSelectedChannelId$().subscribe(onChange);
    return () => sub.unsubscribe();
  }, []);

  const getSelectedChannelId = useCallback(
    () => channelState.getSelectedChannelId(),
    [],
  );

  const channels = useSyncExternalStore(
    subscribeToChannels,
    getChannels,
    getChannels,
  );

  const selectedChannelId = useSyncExternalStore(
    subscribeToSelectedId,
    getSelectedChannelId,
    getSelectedChannelId,
  );

  const selectedChannel: StorageChannel | null =
    channels.find(c => c.id === selectedChannelId) ?? null;

  return {
    initialized,
    error,
    selectedChannel,
  };
}
