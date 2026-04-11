import { invoke } from '@tauri-apps/api/core';
import type {
  ConfigDirectoryEntry,
  LocalPathCheckInput,
  LocalPathCheckResult,
  StorageConfigFile,
} from './types';

export const configFileGateway = {
  getAll: () => invoke<StorageConfigFile[]>('get_config_files'),

  create: (configFile: StorageConfigFile) =>
    invoke<void>('create_config_file', { configFile }),

  checkLocalPaths: (paths: LocalPathCheckInput[]) =>
    invoke<LocalPathCheckResult[]>('check_local_paths', { paths }),

  update: (configFile: StorageConfigFile) =>
    invoke<void>('update_config_file', { configFile }),

  delete: (id: string) => invoke<void>('delete_config_file', { id }),

  listDirectory: (path: string) =>
    invoke<ConfigDirectoryEntry[]>('list_config_directory_entries', { path }),

  openFolder: (path: string) =>
    invoke<void>('open_config_file_folder', { path }),

  openInOpencode: (path: string) =>
    invoke<void>('open_config_file_in_opencode', { path }),

  openInCursor: (path: string) =>
    invoke<void>('open_config_file_in_cursor', { path }),

  openInZed: (path: string) =>
    invoke<void>('open_config_file_in_zed', { path }),

  readContent: (path: string) => invoke<string>('read_config_file', { path }),

  writeContent: (path: string, content: string) =>
    invoke<void>('write_config_file', { path, content }),
};
