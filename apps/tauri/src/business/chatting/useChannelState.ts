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

  const getChannelsSnapshot = useCallback(() => channelState.getChannels(), []);

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
    return channelState.createNewChannel();
  }, []);

  const createChannelWithMessage = useCallback(async (message: string) => {
    return channelState.createChannelWithMessage(message);
  }, []);

  const selectChannel = useCallback(async (channelId: string) => {
    await channelState.selectChannel(channelId);
  }, []);

  const startNewChat = useCallback(() => {
    channelState.clearSelection();
  }, []);

  const getPendingMessage = useCallback(() => {
    return channelState.getPendingMessage();
  }, []);

  const clearPendingMessage = useCallback(() => {
    channelState.setPendingMessage(null);
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
