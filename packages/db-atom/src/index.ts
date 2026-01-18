import {
  AllModelIdsSchema,
  type LLMProviderName,
  LLMProviderNameSchema,
} from '@allin/ai';
import type { ChannelSchema, ConfigSchema, DB_MESSAGE } from '@allin/db-schema';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import type { UIMessage } from 'ai';
import { atom } from 'jotai';
import type { z } from 'zod/v3';

type Channel = z.infer<typeof ChannelSchema>;
type Config = z.infer<typeof ConfigSchema>;

export type AllinDbAdapter = {
  getChannels: () => Promise<Channel[]>;
  createChannel: (channel: Channel) => Promise<string>;
  updateChannel: (
    channelId: string,
    channel: Partial<Channel>,
  ) => Promise<void>;
  deleteChannel: (channelId: string) => Promise<void>;

  getConfig: () => Promise<Config>;
  updateConfig: (config: Partial<Config>) => Promise<void>;

  getMessages: () => Promise<DB_MESSAGE[]>;
  addMessage: (
    channelId: string,
    message: UIMessage<UIMessageMetadata>,
  ) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  deleteMessagesByChannelId: (channelId: string) => Promise<void>;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function createDbAtoms(db: AllinDbAdapter) {
  const allChannelsRefreshAtom = atom(0);
  const allChannelsAtom = atom(async get => {
    get(allChannelsRefreshAtom); // dependency
    const channels = await db.getChannels();
    return channels;
  });
  // create channel and update all channels atom automatically.
  const createChannelAtom = atom(null, async (_, set, newChannel: Channel) => {
    const newChannelId = await db.createChannel(newChannel);
    set(allChannelsRefreshAtom, prev => prev + 1);
    return newChannelId;
  });

  const configRefreshAtom = atom(0);

  const configAtom = atom(async get => {
    get(configRefreshAtom); // dependency
    const config = await db.getConfig();
    const apiKeys = config.apiKeys;
    // in database, api key is stored as string.
    // so we need to check if string is valid provider name and assert type.
    const safeApiKeys = Object.fromEntries(
      Object.entries(apiKeys).map<[LLMProviderName, string | undefined]>(
        ([key, value]) => {
          const safeKey = LLMProviderNameSchema.parse(key);
          return [safeKey, value];
        },
      ),
    ) as Record<LLMProviderName, string | undefined>;

    return {
      ...config,
      apiKeys: safeApiKeys,
    };
  });

  const updateConfigAtom = atom(
    null,
    async (get, set, newConfig: Partial<Config>) => {
      await db.updateConfig(newConfig);
      // increase refresh trigger to refresh config atom
      set(configRefreshAtom, get(configRefreshAtom) + 1);
    },
  );

  const selectedChannelIdAtom = atom(async get => {
    return (await get(configAtom))?.lastSelectedChannelId ?? null;
  });

  // 1. update selected channel id
  // 2. update config atom
  // 3. update selected channel id atom (because there is dependency between configAtom and selectedChannelIdAtom)
  const updateSelectedChannelIdAtom = atom(
    null,
    async (_, set, newSelectedChannelId: string) => {
      await set(updateConfigAtom, {
        lastSelectedChannelId: newSelectedChannelId,
      });
    },
  );

  const selectedChannelAtom = atom(async get => {
    const selectedChannelId = await get(selectedChannelIdAtom);
    if (!selectedChannelId) return null;

    const allChannels = await get(allChannelsAtom);
    const channel = allChannels.find(c => c.id === selectedChannelId);

    assert(
      channel,
      `db-atom: channel is not found, selectedChannelId: ${selectedChannelId}`,
    );

    // In db, providerName and model are stored as string type.
    // so we need to check if string is valid provider name and model id and assert type.
    const parsedProviderName = LLMProviderNameSchema.parse(
      channel.providerName,
    );
    const parsedModelId = AllModelIdsSchema.parse(channel.model);

    return {
      ...channel,
      providerName: parsedProviderName,
      model: parsedModelId,
    };
  });

  const updateChannelAtom = atom(
    null,
    async (_, set, channelId: string, channel: Partial<Channel>) => {
      const updatedAt = Date.now();
      await db.updateChannel(channelId, { ...channel, updatedAt });
      set(allChannelsRefreshAtom, prev => prev + 1);
    },
  );

  const deleteChannelAtom = atom(null, async (_, set, channelId: string) => {
    await db.deleteChannel(channelId);
    set(allChannelsRefreshAtom, prev => prev + 1);
  });

  const allMessagesRefreshAtom = atom(0);
  const allMessagesAtom = atom(async get => {
    get(allMessagesRefreshAtom); // dependency
    return await db.getMessages();
  });

  const selectedChannelMessagesAtom = atom(async get => {
    const selectedChannelId = await get(selectedChannelIdAtom);
    if (!selectedChannelId) return [] as DB_MESSAGE[];

    const allMessages = await get(allMessagesAtom);
    return allMessages.filter(m => m.channelId === selectedChannelId);
  });

  const addMessageAtom = atom(
    null,
    async (
      _,
      set,
      channelId: string,
      message: UIMessage<UIMessageMetadata>,
    ) => {
      await db.addMessage(channelId, message);
      set(allMessagesRefreshAtom, prev => prev + 1);
    },
  );

  const deleteMessageAtom = atom(null, async (_, set, messageId: string) => {
    await db.deleteMessage(messageId);
    set(allMessagesRefreshAtom, prev => prev + 1);
  });

  const deleteMessagesByChannelIdAtom = atom(
    null,
    async (_, set, channelId: string) => {
      await db.deleteMessagesByChannelId(channelId);
      set(allMessagesRefreshAtom, prev => prev + 1);
    },
  );

  return {
    configAtom,
    allChannelsAtom,
    selectedChannelIdAtom,
    selectedChannelAtom,
    selectedChannelMessagesAtom,
    allMessagesAtom,
    addMessageAtom,
    deleteMessageAtom,
    deleteMessagesByChannelIdAtom,
    createChannelAtom,
    updateChannelAtom,
    deleteChannelAtom,
    updateSelectedChannelIdAtom,
    updateConfigAtom,
  };
}
