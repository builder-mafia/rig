import { invoke } from '@tauri-apps/api/core';
import type {
  LocalPathCheckInput,
  LocalPathCheckResult,
  StorageConfigFile,
  StorageGroup,
} from './types';

export const configFileGateway = {
  getFiles: () => invoke<StorageConfigFile[]>('get_config_files'),

  getGroups: () => invoke<StorageGroup[]>('get_groups'),

  create: (configFile: StorageConfigFile) =>
    invoke<void>('create_config_file', { configFile }),

  createGroup: (group: StorageGroup) =>
    invoke<StorageGroup>('create_group', { group }),

  checkLocalPath: (input: LocalPathCheckInput) =>
    invoke<LocalPathCheckResult>('check_local_path', { input }),
  update: (configFile: StorageConfigFile) =>
    invoke<void>('update_config_file', { configFile }),

  updateGroup: (group: StorageGroup) => invoke<void>('update_group', { group }),

  delete: (id: string) => invoke<void>('delete_config_file', { id }),

  deleteGroup: (id: string) => invoke<void>('delete_group', { id }),

  readContent: (path: string) => invoke<string>('read_file', { path }),

  writeContent: (path: string, content: string) =>
    invoke<void>('write_file', { path, content }),
};
