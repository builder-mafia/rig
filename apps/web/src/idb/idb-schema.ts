import {
  type ChannelSchema,
  type ConfigSchema,
  type DB_CONFIG_KEY,
  type DB_MESSAGE,
  DB_STORE,
} from '@allin/db-schema';
import type { DBSchema } from 'idb';
import type { z } from 'zod';

export interface ALLIN_DB extends DBSchema {
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
    key: typeof DB_CONFIG_KEY;
    value: z.infer<typeof ConfigSchema>;
  };
}
