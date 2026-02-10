import { invoke } from '@tauri-apps/api/core';
import type { StorageAgent } from '@/business/chatting/storage/types';

export const agentGateway = {
  get: (id: string) => invoke<StorageAgent>('get_agent', { id }),

  getAll: () => invoke<StorageAgent[]>('get_all_agents'),

  create: (agent: StorageAgent) =>
    invoke<void>('create_agent', { agent }),

  update: (agent: StorageAgent) =>
    invoke<void>('update_agent', { agent }),

  delete: (id: string) => invoke<void>('delete_agent', { id }),
};
