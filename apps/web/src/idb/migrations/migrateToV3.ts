import { DB_STORE, type DBStoreName } from '@allin/db-schema';
import type { IDBPTransaction } from 'idb';
import type { ALLIN_DB } from '../idb-schema';

/**
 * v3 migration
 * - add reasoningEffort (default: 'low')
 * - add reasoningSummary (default: false)
 */
export const migrateToV3 = async (
  transaction: IDBPTransaction<ALLIN_DB, DBStoreName[], 'versionchange'>,
) => {
  const channelStore = transaction.objectStore(DB_STORE.CHANNELS);
  const channels = await channelStore.getAll();

  await Promise.all(
    channels.map(channel =>
      channelStore.put({
        ...channel,
        reasoningEffort: channel.reasoningEffort ?? 'low',
        reasoningSummary: channel.reasoningSummary ?? false,
      }),
    ),
  );
};
