'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useService } from '@/business/ServiceContext';

export function useChannel() {
  const { channelManager } = useService();
  const subscribeToChannels = useCallback(
    (onChange: () => void) => {
      const sub = channelManager.channels$.subscribe(onChange);
      return () => sub.unsubscribe();
    },
    [channelManager],
  );
  const getChannelsSnapshot = useCallback(
    () => channelManager.channels,
    [channelManager],
  );

  const subscribeToSelectedId = useCallback(
    (onChange: () => void) => {
      const sub = channelManager.selectedChannelId$.subscribe(onChange);
      return () => sub.unsubscribe();
    },
    [channelManager],
  );

  const getSelectedChannelId = useCallback(
    () => channelManager.selectedChannelId,
    [channelManager],
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

  const selectedChannel = useMemo(() => {
    return channels.find(c => c.id === selectedChannelId) ?? null;
  }, [channels, selectedChannelId]);

  const createNewChannel = useCallback(async () => {
    const channel = await channelManager.createNewChannel();
    return channel;
  }, [channelManager]);

  const selectChannel = useCallback(
    async (channelId: string) => {
      await channelManager.selectChannel(channelId);
    },
    [channelManager],
  );

  const fetchChannels = useCallback(async () => {
    await channelManager.fetchChannels();
  }, [channelManager]);

  const updateChannelTitle = useCallback(
    async (channelId: string, title: string) => {
      await channelManager.updateChannelTitle(channelId, title);
      await channelManager.fetchChannels();
    },
    [channelManager],
  );

  return {
    channels,
    selectedChannel,
    createNewChannel,
    selectChannel,
    fetchChannels,
    updateChannelTitle,
  };
}
