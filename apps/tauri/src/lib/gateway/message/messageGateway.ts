import { invoke } from '@tauri-apps/api/core';
import type { StorageMessage } from '@/business/chatting/storage/types';

export const messageGateway = {
  getAll: (channelId: string) =>
    invoke<StorageMessage[]>('get_messages', { channelId }),

  append: (channelId: string, message: StorageMessage) =>
    invoke<void>('append_message', { channelId, message }),

  upsert: (channelId: string, message: StorageMessage) =>
    invoke<void>('upsert_message', { channelId, message }),
};
