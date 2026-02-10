import { invoke } from '@tauri-apps/api/core';
import type { StorageChannel } from '@/business/chatting/storage/types';

export const channelGateway = {
  getAll: () => invoke<StorageChannel[]>('get_channels'),

  get: (id: string) => invoke<StorageChannel>('get_channel', { id }),

  create: (info: StorageChannel) =>
    invoke<void>('create_channel', { info }),

  update: (info: StorageChannel) =>
    invoke<void>('update_channel', { info }),

  delete: (id: string) => invoke<void>('delete_channel', { id }),
};
