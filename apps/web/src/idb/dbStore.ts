import { atom } from 'jotai';
import type z from 'zod';
import { assertDefined } from '@/utils/assertDefined';
import { type ConfigSchema, DB, type DB_MESSAGE } from './db';

export const isDataBaseInitializedAtom = atom(false);

const allChannelsAtom = atom(async () => {
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

const selectedChannelAtom = atom(async get => {
  const selectedChannelId = await get(selectedChannelIdAtom);
  if (!selectedChannelId) return null;
  const channel = await DB.getChannel(selectedChannelId);

  assertDefined(
    channel,
    `channel is not found, selectedChannelId: ${selectedChannelId}`,
  );

  return channel;
});

const configAtom = atom(
  async () => {
    const config = await DB.getConfig();
    return config;
  },
  async (_, set, newConfig: Partial<z.infer<typeof ConfigSchema>>) => {
    await DB.updateConfig(newConfig);
    const updatedConfig = await DB.getConfig();
    await set(configAtom, updatedConfig);
  },
);

const openAiApiKeyAtom = atom(
  async get => {
    return (await get(configAtom))?.openaiApiKey ?? null;
  },
  async (_, set, newOpenAiApiKey: string) => {
    await set(configAtom, { openaiApiKey: newOpenAiApiKey });
  },
);

const googleApiKeyAtom = atom(
  async get => {
    return (await get(configAtom))?.googleApiKey ?? null;
  },
  async (_, set, newGoogleApiKey: string) => {
    await set(configAtom, { googleApiKey: newGoogleApiKey });
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
  openAiApiKeyAtom,
  googleApiKeyAtom,
  configAtom,
  allMessagesAtom,
  selectedChannelMessagesAtom,
};
