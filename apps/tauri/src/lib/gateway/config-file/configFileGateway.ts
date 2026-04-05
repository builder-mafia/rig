import { invoke } from '@tauri-apps/api/core';
import type { ConfigDirectoryEntry, StorageConfigFile } from './types';

export const configFileGateway = {
  getAll: () => invoke<StorageConfigFile[]>('get_config_files'),

  create: (configFile: StorageConfigFile) =>
    invoke<void>('create_config_file', { configFile }),

  update: (configFile: StorageConfigFile) =>
    invoke<void>('update_config_file', { configFile }),

  delete: (id: string) => invoke<void>('delete_config_file', { id }),

  listDirectory: (path: string) =>
    invoke<ConfigDirectoryEntry[]>('list_config_directory_entries', { path }),

  openFolder: (path: string) =>
    invoke<void>('open_config_file_folder', { path }),

  readContent: (path: string) => invoke<string>('read_config_file', { path }),

  writeContent: (path: string, content: string) =>
    invoke<void>('write_config_file', { path, content }),
};
