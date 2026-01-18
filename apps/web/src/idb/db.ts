import type { LLMProviderName } from '@allin/ai';
import {
  type ChannelSchema,
  ConfigSchema,
  DB_CONFIG_KEY,
  type DB_MESSAGE,
  DB_NAME,
  DB_STORE,
  type DBStoreName,
} from '@allin/db-schema';
import type { UIMessage } from 'ai';
import { type IDBPDatabase, openDB } from 'idb';
import type { z } from 'zod/v3';
import type { ALLIN_DB } from './idb-schema';
import { initDb } from './migrations/initDb';
import { migrateToV3 } from './migrations/migrateToV3';

const DB_VERSION = 3;

let db: IDBPDatabase<ALLIN_DB>;

const getDB = async () => {
  if (!db) {
    db = await openDB<ALLIN_DB>(DB_NAME, DB_VERSION, {
      async upgrade(db, oldVersion, _newVersion, transaction) {
        initDb(db);

        // migrations
        // v3: add reasoning fields to channels with defaults
        if (oldVersion < 3) {
          await migrateToV3(transaction);
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

const deleteChannel = async (id: string) => {
  const db = await getDB();
  return db.delete(DB_STORE.CHANNELS, id);
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
  const config = await db.get(DB_STORE.CONFIG, DB_CONFIG_KEY);

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
  const existingConfig = (await store.get(DB_CONFIG_KEY)) ?? { apiKeys: {} };

  await store.put(
    {
      ...existingConfig,
      apiKeys: {
        ...existingConfig.apiKeys,
        [providerName]: apiKey,
      },
    },
    DB_CONFIG_KEY,
  );
  await tx.done;
};

const updateConfig = async (config: Partial<z.infer<typeof ConfigSchema>>) => {
  const db = await getDB();
  const tx = db.transaction(DB_STORE.CONFIG, 'readwrite');
  const store = tx.objectStore(DB_STORE.CONFIG);
  const existingConfig = (await store.get(DB_CONFIG_KEY)) ?? { apiKeys: {} };

  await store.put(
    {
      ...existingConfig,
      ...config,
      apiKeys: {
        ...existingConfig.apiKeys,
        ...config.apiKeys,
      },
    },
    DB_CONFIG_KEY,
  );
  await tx.done;
};

const getMessages = async () => {
  const db = await getDB();
  const messages = await db.getAll(DB_STORE.MESSAGES);

  // sort messages by createdAt
  return messages.sort(
    (a, b) => (a.metadata?.createdAt ?? 0) - (b.metadata?.createdAt ?? 0),
  );
};

const getMessagesByChannelId = async (channelId: string) => {
  const db = await getDB();
  const messages = await db.getAllFromIndex(
    DB_STORE.MESSAGES,
    'channelId',
    channelId,
  );
  return messages.sort(
    (a, b) => (a.metadata?.createdAt ?? 0) - (b.metadata?.createdAt ?? 0),
  );
};

const addMessage = async (channelId: string, message: UIMessage) => {
  const db = await getDB();
  const channel = await getChannel(channelId);
  if (!channel) {
    throw new Error('Channel not found');
  }

  return db.add(DB_STORE.MESSAGES, {
    ...message,
    channelId,
  } as DB_MESSAGE);
};

const deleteMessage = async (messageId: string) => {
  const db = await getDB();
  return db.delete(DB_STORE.MESSAGES, messageId);
};

const deleteMessagesByChannelId = async (channelId: string) => {
  const db = await getDB();
  const tx = db.transaction(DB_STORE.MESSAGES, 'readwrite');
  const store = tx.objectStore(DB_STORE.MESSAGES);
  const index = store.index('channelId');

  const keys = await index.getAllKeys(channelId);

  await Promise.all(keys.map(key => store.delete(key)));

  await tx.done;
};

const clearStore = async (storeName: DBStoreName) => {
  const db = await getDB();
  return db.clear(storeName);
};

export const DB = {
  getDB,
  getSnapshot,
  getChannel,
  getChannels,
  createChannel,
  deleteChannel,
  updateChannel,
  updateApiKey,
  getConfig,
  updateConfig,
  getMessagesByChannelId,
  getMessages,
  addMessage,
  deleteMessage,
  deleteMessagesByChannelId,
  clearStore,
};
