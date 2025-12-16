import { DB_CONFIG_KEY, DB_STORE } from '@allin/db-schema';
import type { IDBPDatabase } from 'idb';
import type { ALLIN_DB } from '../idb-schema';

export const initDb = (db: IDBPDatabase<ALLIN_DB>) => {
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
        apiKeys: {},
      },
      DB_CONFIG_KEY,
    );
  }
};
