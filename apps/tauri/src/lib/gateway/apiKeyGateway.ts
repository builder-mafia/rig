import type { ProviderId } from '@allin/ai';
import { invoke } from '@tauri-apps/api/core';

export const apiKeyGateway = {
  has: (providerName: ProviderId) =>
    invoke<boolean>('has_api_key', { providerName }),

  save: (providerName: ProviderId, apiKey: string) =>
    invoke<void>('save_api_key', { providerName, apiKey }),

  delete: (providerName: ProviderId) =>
    invoke<void>('delete_api_key', { providerName }),
};
