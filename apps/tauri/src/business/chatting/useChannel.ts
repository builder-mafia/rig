'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { ChannelManager } from './ChannelManager';
import type { StorageChannel } from './storage/types';

const channelManager = ChannelManager.getInstance();

export function useChannel() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    channelManager
      .initialize()
      .then(() => setInitialized(true))
      .catch(e => setError(e instanceof Error ? e : new Error(String(e))));
  }, []);

  const subscribeToChannels = useCallback((onChange: () => void) => {
    const sub = channelManager.channels$.subscribe(onChange);
    return () => sub.unsubscribe();
  }, []);

  const getChannelsSnapshot = useCallback(() => channelManager.channels, []);

  const subscribeToSelectedId = useCallback((onChange: () => void) => {
    const sub = channelManager.selectedChannelId$.subscribe(onChange);
    return () => sub.unsubscribe();
  }, []);

  const getSelectedChannelId = useCallback(
    () => channelManager.selectedChannelId,
    [],
  );

  const channels = useSyncExternalStore(
    subscribeToChannels,
    getChannelsSnapshot,
    getChannelsSnapshot,
  );

  const selectedChannelId = useSyncExternalStore(
    subscribeToSelectedId,
    getSelectedChannelId,
    getSelectedChannelId,
  );

  const selectedChannel: StorageChannel | null =
    channels.find(c => c.id === selectedChannelId) ?? null;

  const createNewChannel = useCallback(async () => {
    return channelManager.createNewChannel();
  }, []);

  const createChannelWithMessage = useCallback(async (message: string) => {
    return channelManager.createChannelWithMessage(message);
  }, []);

  const selectChannel = useCallback(async (channelId: string) => {
    await channelManager.selectChannel(channelId);
  }, []);

  const startNewChat = useCallback(() => {
    channelManager.clearSelection();
  }, []);

  const getPendingMessage = useCallback(() => {
    return channelManager.pendingMessage;
  }, []);

  const clearPendingMessage = useCallback(() => {
    channelManager.setPendingMessage(null);
  }, []);

  return {
    initialized,
    error,
    channels,
    selectedChannel,
    createNewChannel,
    createChannelWithMessage,
    selectChannel,
    startNewChat,
    getPendingMessage,
    clearPendingMessage,
  };
}
