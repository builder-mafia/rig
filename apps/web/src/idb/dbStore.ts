import { atom } from 'jotai';
import type z from 'zod';
import { assertDefined } from '@/utils/assertDefined';
import {
  type ChannelSchema,
  type ConfigSchema,
  DB,
  type DB_MESSAGE,
} from './db';

export const isDataBaseInitializedAtom = atom(false);

const allChannelsRefreshAtom = atom(0);
const allChannelsAtom = atom(async get => {
  get(allChannelsRefreshAtom); // dependency
  const channels = await DB.getChannels();
  return channels;
});

const selectedChannelIdAtom = atom(
  async get => {
    return (await get(configAtom))?.lastSelectedChannelId ?? null;
  },
  async (_, set, newSelectedChannelId: string) => {
    await set(configAtom, { lastSelectedChannelId: newSelectedChannelId });
  },
);

const selectedChannelAtom = atom(
  async get => {
    const selectedChannelId = await get(selectedChannelIdAtom);
    if (!selectedChannelId) return null;
    const allChannels = await get(allChannelsAtom);
    const channel = allChannels.find(
      channel => channel.id === selectedChannelId,
    );

    assertDefined(
      channel,
      `channel is not found, selectedChannelId: ${selectedChannelId}`,
    );

    return channel;
  },
  async (get, set, channel: Partial<z.infer<typeof ChannelSchema>>) => {
    const selectedChannel = await get(selectedChannelAtom);

    if (!selectedChannel) {
      throw new Error(`dbStore: selectedChannel is not found.`);
    }

    await DB.updateChannel(selectedChannel.id, channel);
    set(allChannelsRefreshAtom, prev => prev + 1);
  },
);

// for refreshing config atom
const configRefreshAtom = atom(0);

const configAtom = atom(
  async get => {
    get(configRefreshAtom); // dependency
    const config = await DB.getConfig();
    return config;
  },
  async (get, set, newConfig: Partial<z.infer<typeof ConfigSchema>>) => {
    await DB.updateConfig(newConfig);
    // increase refresh trigger to refresh config atom
    set(configRefreshAtom, get(configRefreshAtom) + 1);
  },
);

const allMessagesAtom = atom(
  async () => {
    return await DB.getMessages();
  },
  async (get, set, newMessages: DB_MESSAGE[]) => {
    const selectedChannelId = await get(selectedChannelIdAtom);

    assertDefined(selectedChannelId, 'selectedChannelId is not found');
    for (const message of newMessages) {
      await DB.addMessage(selectedChannelId, message);
    }
    const updatedMessages = await DB.getMessages();
    await set(allMessagesAtom, updatedMessages);
  },
);

const selectedChannelMessagesAtom = atom(
  async get => {
    const selectedChannelId = await get(selectedChannelIdAtom);
    if (!selectedChannelId) return [];

    const allMessages = await get(allMessagesAtom);
    return allMessages.filter(
      message => message.channelId === selectedChannelId,
    );
  },
  async (_, set, newMessages: DB_MESSAGE[]) => {
    await set(allMessagesAtom, newMessages);
  },
);

export const dbAtoms = {
  allChannelsAtom,
  selectedChannelIdAtom,
  selectedChannelAtom,
  configAtom,
  allMessagesAtom,
  selectedChannelMessagesAtom,
};
