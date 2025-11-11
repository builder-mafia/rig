import { type DBSchema, type IDBPDatabase, openDB } from 'idb';
import { z } from 'zod';
import type { AiService } from '@/core/chat/ai-model';
import type { MyMessage } from '../main/chat/Chat';

export const DB_NAME = 'ALLIN';
export const DEFAULT_CHANNEL_ID = 'DEFAULT-CHANNEL';
const DB_VERSION = 2;

export const ChannelSchema = z.object({
  id: z.string(),
  name: z.string().optional().describe('Channel name'),
  description: z.string().optional().describe('Channel description'),
  prompt: z.string().optional().describe('AI system prompt'),
  createdAt: z.number().min(0).describe('Timestamp of creation'),
});

export const ConfigSchema = z.object({
  lastSelectedChannelId: z.string().optional(),
  googleApiKey: z.string().optional().describe('Google API key'),
  openaiApiKey: z.string().optional().describe('OpenAI API key'),
});

export type DB_MESSAGE = MyMessage & { channelId: string };

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
          messagesStore.createIndex('channelId', 'channelId');
        }
        if (oldVersion < 2) {
          if (db.objectStoreNames.contains(DB_STORE.CONFIG)) {
            db.deleteObjectStore(DB_STORE.CONFIG);
          }
          db.createObjectStore(DB_STORE.CONFIG, { keyPath: 'key' });
        }
      },
    });
  }

  return db;
};

const getChannel = async (id: string) => {
  const db = await getDB();
  return db.get(DB_STORE.CHANNELS, id);
};

const getChannels = async () => {
  const db = await getDB();
  return db.getAll(DB_STORE.CHANNELS);
};

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
  return db.get(DB_STORE.CONFIG, CONFIG_KEY);
};

const updateApiKey = async (provider: AiService, apiKey: string) => {
  const db = await getDB();
  const tx = db.transaction(DB_STORE.CONFIG, 'readwrite');
  const store = tx.objectStore(DB_STORE.CONFIG);
  const existingConfig = (await store.get(CONFIG_KEY)) ?? {};
  await store.put({
    ...existingConfig,
    [provider]: apiKey,
  });
  await tx.done;
};

const updateConfig = async (config: Partial<z.infer<typeof ConfigSchema>>) => {
  const db = await getDB();
  const tx = db.transaction(DB_STORE.CONFIG, 'readwrite');
  const store = tx.objectStore(DB_STORE.CONFIG);
  const existingConfig = (await store.get(CONFIG_KEY)) ?? {};

  await store.put({
    ...existingConfig,
    ...config,
  });
  await tx.done;
};

const getMessagesByChannelId = async (channelId: string) => {
  const db = await getDB();
  return db.getAllFromIndex(DB_STORE.MESSAGES, 'channelId', channelId);
};

const addMessage = async (message: DB_MESSAGE) => {
  const db = await getDB();
  const channel = await getChannel(message.channelId);
  if (!channel) {
    throw new Error('Channel not found');
  }

  return db.add(DB_STORE.MESSAGES, message);
};

const clearStore = async (storeName: DB_STORE) => {
  const db = await getDB();
  return db.clear(storeName);
};

export const DB = {
  getDB,
  getChannel,
  getChannels,
  createChannel,
  updateChannel,
  updateApiKey,
  getConfig,
  updateConfig,
  getMessagesByChannelId,
  addMessage,
  clearStore,
};
