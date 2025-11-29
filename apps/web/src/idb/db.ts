import type { UIMessage } from 'ai';
import { type DBSchema, type IDBPDatabase, openDB } from 'idb';
import { z } from 'zod';
import {
  AllModelIdsSchema,
  type LLMProviderName,
  LLMProviderNameSchema,
} from '@/core/provider/all-models';

export const DB_NAME = 'ALLIN';
export const DEFAULT_CHANNEL_ID = 'DEFAULT-CHANNEL';
const DB_VERSION = 2;

export const ChannelSchema = z.object({
  id: z.string(),
  model: AllModelIdsSchema.describe('selected AI model'),
  providerName: LLMProviderNameSchema.describe('selected AI provider'),
  createdAt: z.number().min(0).describe('Timestamp of creation'),
  name: z.string().optional().describe('Channel name'),
  description: z.string().optional().describe('Channel description'),
  prompt: z.string().optional().describe('AI system prompt'),
  isEmpty: z
    .boolean()
    .default(true)
    .describe(
      'Whether the channel is empty. If true, it means the channel has no messages.',
    ),
});

export const ConfigSchema = z.object({
  lastSelectedChannelId: z.string().optional(),
  googleApiKey: z.string().optional().describe('Google API key'),
  openaiApiKey: z.string().optional().describe('OpenAI API key'),
});

export type DB_MESSAGE = UIMessage & { channelId: string };

export enum DB_STORE {
  CHANNELS = 'channels',
  MESSAGES = 'messages',
  CONFIG = 'config',
}

const CONFIG_KEY = 'userConfig';
interface ALLIN_DB extends DBSchema {
  [DB_STORE.CHANNELS]: {
    key: string;
    value: z.infer<typeof ChannelSchema>;
  };
  [DB_STORE.MESSAGES]: {
    key: string;
    value: DB_MESSAGE;
    indexes: { channelId: string };
  };
  [DB_STORE.CONFIG]: {
    key: typeof CONFIG_KEY;
    value: z.infer<typeof ConfigSchema>;
  };
}

let db: IDBPDatabase<ALLIN_DB>;

const getDB = async () => {
  if (!db) {
    db = await openDB<ALLIN_DB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction, event) {
        if (!db.objectStoreNames.contains(DB_STORE.CHANNELS)) {
          db.createObjectStore(DB_STORE.CHANNELS, {
            keyPath: 'id',
          });
        }
        if (!db.objectStoreNames.contains(DB_STORE.MESSAGES)) {
          const messagesStore = db.createObjectStore(DB_STORE.MESSAGES, {
            autoIncrement: true,
          });
          // this makes it quicker to get messages by channel id.
          messagesStore.createIndex('channelId', 'channelId');
        }
        if (!db.objectStoreNames.contains(DB_STORE.CONFIG)) {
          const configStore = db.createObjectStore(DB_STORE.CONFIG);
          configStore.put(
            {
              lastSelectedChannelId: undefined,
              googleApiKey: undefined,
              openaiApiKey: undefined,
            },
            CONFIG_KEY,
          );
        }
      },
    });
  }

  return db;
};

const getSnapshot = async () => {
  return Promise.all([getChannels(), getMessages(), getConfig()]).then(
    ([channels, messages, config]) => {
      return {
        channels,
        messages,
        config,
      };
    },
  );
};

const getChannel = async (id: string) => {
  const db = await getDB();
  return db.get(DB_STORE.CHANNELS, id);
};

const getChannels = async () => {
  const db = await getDB();
  return db.getAll(DB_STORE.CHANNELS);
};

/**
 * @returns id of the created channel
 */
const createChannel = async (channel: z.infer<typeof ChannelSchema>) => {
  const db = await getDB();
  return db.add(DB_STORE.CHANNELS, channel);
};

const updateChannel = async (
  id: string,
  channel: Partial<z.infer<typeof ChannelSchema>>,
) => {
  const db = await getDB();
  const tx = db.transaction(DB_STORE.CHANNELS, 'readwrite');
  const store = tx.objectStore(DB_STORE.CHANNELS);
  const existingChannel = await store.get(id);

  if (existingChannel) {
    const updatedChannel = { ...existingChannel, ...channel };
    await store.put(updatedChannel);
  }

  await tx.done;
};

const getConfig = async () => {
  const db = await getDB();
  const config = await db.get(DB_STORE.CONFIG, CONFIG_KEY);

  /**
   * check if config is valid.
   *
   * if config is undefined, it will throw an error and it means the database is not initialized.
   * this make sure the database is always initialized.
   */
  const parsed = ConfigSchema.parse(config);
  return parsed;
};

const updateApiKey = async (providerName: LLMProviderName, apiKey: string) => {
  const db = await getDB();
  const tx = db.transaction(DB_STORE.CONFIG, 'readwrite');
  const store = tx.objectStore(DB_STORE.CONFIG);
  const existingConfig = (await store.get(CONFIG_KEY)) ?? {};
  await store.put(
    {
      ...existingConfig,
      [`${providerName}ApiKey`]: apiKey,
    },
    CONFIG_KEY,
  );
  await tx.done;
};

const updateConfig = async (config: Partial<z.infer<typeof ConfigSchema>>) => {
  const db = await getDB();
  const tx = db.transaction(DB_STORE.CONFIG, 'readwrite');
  const store = tx.objectStore(DB_STORE.CONFIG);
  const existingConfig = (await store.get(CONFIG_KEY)) ?? {};

  await store.put(
    {
      ...existingConfig,
      ...config,
    },
    CONFIG_KEY,
  );
  await tx.done;
};

const getMessages = async () => {
  const db = await getDB();
  return db.getAll(DB_STORE.MESSAGES);
};

const getMessagesByChannelId = async (channelId: string) => {
  const db = await getDB();
  return db.getAllFromIndex(DB_STORE.MESSAGES, 'channelId', channelId);
};

const addMessage = async (channelId: string, message: UIMessage) => {
  const db = await getDB();
  const channel = await getChannel(channelId);
  if (!channel) {
    throw new Error('Channel not found');
  }

  return db.add(DB_STORE.MESSAGES, { ...message, channelId });
};

const clearStore = async (storeName: DB_STORE) => {
  const db = await getDB();
  return db.clear(storeName);
};

export const DB = {
  getDB,
  getSnapshot,
  getChannel,
  getChannels,
  createChannel,
  updateChannel,
  updateApiKey,
  getConfig,
  updateConfig,
  getMessagesByChannelId,
  getMessages,
  addMessage,
  clearStore,
};
