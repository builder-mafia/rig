import { invoke } from '@tauri-apps/api/core';
import {
  configDocumentSchema,
  configPluginSchema,
  pluginPreviewSchema,
  type ConfigEdit,
} from './types';

export const configPluginsQueryKey = ['config-plugins'] as const;
export const listConfigPlugins = async () =>
  configPluginSchema.array().parse(await invoke('list_config_plugins'));
export const installConfigPlugin = (pluginId: string) =>
  invoke<void>('install_config_plugin', { pluginId });
export const removeConfigPlugin = (pluginId: string) =>
  invoke<void>('remove_config_plugin', { pluginId });
export const previewConfigPlugin = async (manifestPath: string) =>
  pluginPreviewSchema.parse(
    await invoke('preview_config_plugin', { manifestPath }),
  );
export const importConfigPlugin = (
  manifestPath: string,
  expectedRevision: string,
) => invoke<string>('import_config_plugin', { manifestPath, expectedRevision });
export const readConfigFile = async (pluginId: string, fileId: string) =>
  configDocumentSchema.parse(
    await invoke('read_config_file', { pluginId, fileId }),
  );

export const saveConfigFile = async (
  pluginId: string,
  fileId: string,
  edit: ConfigEdit,
  expectedRevision: string | null,
) =>
  configDocumentSchema.parse(
    await invoke('save_config_file', {
      pluginId,
      fileId,
      edit,
      expectedRevision,
    }),
  );

export const isConfigConflict = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'conflict';

export const configErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (
    typeof error === 'object' &&
    error &&
    'message' in error &&
    typeof error.message === 'string'
  )
    return error.message;
  return typeof error === 'string'
    ? error
    : 'Could not complete this configuration operation.';
};
