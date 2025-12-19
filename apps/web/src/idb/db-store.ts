import { AllModelIdsSchema, LLMProviderNameSchema } from '@allin/chat';
import type { ChannelSchema, ConfigSchema, DB_MESSAGE } from '@allin/db-schema';
import type { UIMessage } from 'ai';
import { atom } from 'jotai';
import z from 'zod';
import { assert } from '@/utils/assert';
import { DB } from './db';

export const isDataBaseInitializedAtom = atom(false);

const allChannelsRefreshAtom = atom(0);
const allChannelsAtom = atom(async get => {
  get(allChannelsRefreshAtom); // dependency
  const channels = await DB.getChannels();
  return channels;
});

const createChannelAtom = atom(
  null,
  async (
    _,
    set,
    newChannel: z.infer<typeof ChannelSchema>,
  ): Promise<string> => {
    const newChannelId = await DB.createChannel(newChannel);
    set(allChannelsRefreshAtom, prev => prev + 1);
    return newChannelId;
  },
);

const selectedChannelIdAtom = atom(
  async get => {
    return (await get(configAtom))?.lastSelectedChannelId ?? null;
  },
  async (get, set, newSelectedChannelId: string) => {
    await set(configAtom, { lastSelectedChannelId: newSelectedChannelId });
  },
);

const selectedChannelAtom = atom(async get => {
  const selectedChannelId = await get(selectedChannelIdAtom);
  if (!selectedChannelId) return null;
  const allChannels = await get(allChannelsAtom);
  const channel = allChannels.find(channel => channel.id === selectedChannelId);

  assert(
    channel,
    `channel is not found, selectedChannelId: ${selectedChannelId}`,
  );

  // type assertion: string -> providerName, string -> AllModelIds
  const parsedProviderName = LLMProviderNameSchema.parse(channel.providerName);
  const parsedModelId = AllModelIdsSchema.parse(channel.model);

  return {
    ...channel,
    providerName: parsedProviderName,
    model: parsedModelId,
  };
});

const updateChannelAtom = atom(
  null,
  async (
    _,
    set,
    channelId: string,
    channel: Partial<z.infer<typeof ChannelSchema>>,
  ) => {
    const updatedAt = Date.now();
    await DB.updateChannel(channelId, { ...channel, updatedAt });
    set(allChannelsRefreshAtom, prev => prev + 1);
  },
);

// for refreshing config atom
const configRefreshAtom = atom(0);

const configAtom = atom(
  async get => {
    get(configRefreshAtom);
    const config = await DB.getConfig();

    const apiKeys = config.apiKeys;
    const safeApiKeys = z
      .record(LLMProviderNameSchema, z.string())
      .parse(apiKeys);

    return {
      ...config,
      apiKeys: safeApiKeys,
    };
  },
  async (get, set, newConfig: Partial<z.infer<typeof ConfigSchema>>) => {
    await DB.updateConfig(newConfig);
    // increase refresh trigger to refresh config atom
    set(configRefreshAtom, get(configRefreshAtom) + 1);
  },
);

const allMessagesRefreshAtom = atom(0);
const allMessagesAtom = atom(
  async get => {
    get(allMessagesRefreshAtom); // dependency
    return await DB.getMessages();
  },
  async (_, set, newMessages: DB_MESSAGE[]) => {
    for (const message of newMessages) {
      const channelId = message.channelId;
      assert(channelId, 'channelId is not found');
      await DB.addMessage(channelId, message);
    }
    set(allMessagesRefreshAtom, prev => prev + 1);
  },
);

const selectedChannelMessagesAtom = atom(async get => {
  const selectedChannelId = await get(selectedChannelIdAtom);
  if (!selectedChannelId) return [];

  const allMessages = await get(allMessagesAtom);
  return allMessages.filter(message => message.channelId === selectedChannelId);
});

const addMessageAtom = atom(
  null,
  async (_, set, channelId: string, message: UIMessage) => {
    await DB.addMessage(channelId, message);
    set(allMessagesRefreshAtom, prev => prev + 1);
  },
);

const deleteMessagesByChannelIdAtom = atom(
  null,
  async (get, set, channelId: string) => {
    await DB.deleteMessagesByChannelId(channelId);
    set(allMessagesRefreshAtom, prev => prev + 1);
  },
);

const deleteChannelAtom = atom(null, async (get, set, channelId: string) => {
  await DB.deleteChannel(channelId);
  set(allChannelsRefreshAtom, prev => prev + 1);
});

export const dbAtoms = {
  configAtom,
  allChannelsAtom,
  selectedChannelIdAtom,
  selectedChannelAtom,
  selectedChannelMessagesAtom,
  allMessagesAtom,
  addMessageAtom,
  deleteMessagesByChannelIdAtom,
  createChannelAtom,
  updateChannelAtom,
  deleteChannelAtom,
};
