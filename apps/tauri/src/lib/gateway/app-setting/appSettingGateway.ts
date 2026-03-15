import { invoke } from '@tauri-apps/api/core';
import type { StorageAppSettings } from './types';

export const appSettingGateway = {
  get: () => invoke<StorageAppSettings>('get_app_settings'),

  save: (settings: StorageAppSettings) =>
    invoke<void>('save_app_settings', { settings }),

  getSystemFonts: () => invoke<string[]>('get_system_fonts'),
};
