'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useService } from '@/business/ServiceContext';
import type { ConfigDirectoryEntry } from '@/lib/gateway/config-file/types';

export const useConfigFile = () => {
  const { configFileManager } = useService();

  const subscribeToConfigFiles = useCallback(
    (onChange: () => void) => {
      const subscription = configFileManager.configFiles$.subscribe(onChange);
      return () => subscription.unsubscribe();
    },
    [configFileManager],
  );

  const getConfigFilesSnapshot = useCallback(
    () => configFileManager.configFiles,
    [configFileManager],
  );

  const configFiles = useSyncExternalStore(
    subscribeToConfigFiles,
    getConfigFilesSnapshot,
    getConfigFilesSnapshot,
  );

  const subscribeToSelectedConfigFileId = useCallback(
    (onChange: () => void) => {
      const subscription =
        configFileManager.selectedConfigFileId$.subscribe(onChange);
      return () => subscription.unsubscribe();
    },
    [configFileManager],
  );

  const getSelectedConfigFileIdSnapshot = useCallback(
    () => configFileManager.selectedConfigFileId,
    [configFileManager],
  );

  const selectedConfigFileId = useSyncExternalStore(
    subscribeToSelectedConfigFileId,
    getSelectedConfigFileIdSnapshot,
    getSelectedConfigFileIdSnapshot,
  );

  const selectedConfigFile = useMemo(() => {
    return (
      configFiles.find(configFile => configFile.id === selectedConfigFileId) ??
      null
    );
  }, [configFiles, selectedConfigFileId]);

  const fetchConfigFiles = useCallback(async () => {
    await configFileManager.fetchConfigFiles();
  }, [configFileManager]);

  const createConfigFile = useCallback(
    async (
      name: string,
      path: string,
      isDirectory: boolean,
      iconType: 'preset' | 'uploaded' | null,
      iconValue: string | null,
    ) => {
      return configFileManager.createConfigFile({
        name,
        path,
        isDirectory,
        iconType,
        iconValue,
      });
    },
    [configFileManager],
  );

  const updateConfigFile = useCallback(
    async (configFileId: string, name: string, path: string) => {
      await configFileManager.updateConfigFile(configFileId, { name, path });
    },
    [configFileManager],
  );

  const deleteConfigFile = useCallback(
    async (configFileId: string) => {
      await configFileManager.deleteConfigFile(configFileId);
    },
    [configFileManager],
  );

  const selectConfigFile = useCallback(
    (configFileId: string) => {
      configFileManager.selectConfigFile(configFileId);
    },
    [configFileManager],
  );

  const readConfigFile = useCallback(
    async (path: string) => {
      return configFileManager.readConfigFile(path);
    },
    [configFileManager],
  );

  const writeConfigFile = useCallback(
    async (path: string, content: string) => {
      await configFileManager.writeConfigFile(path, content);
    },
    [configFileManager],
  );

  const openConfigFileFolder = useCallback(
    async (path: string) => {
      await configFileManager.openConfigFileFolder(path);
    },
    [configFileManager],
  );

  const listConfigDirectoryEntries = useCallback(
    async (path: string): Promise<ConfigDirectoryEntry[]> => {
      return configFileManager.listConfigDirectoryEntries(path);
    },
    [configFileManager],
  );

  return {
    configFiles,
    selectedConfigFile,
    fetchConfigFiles,
    createConfigFile,
    updateConfigFile,
    deleteConfigFile,
    selectConfigFile,
    readConfigFile,
    writeConfigFile,
    openConfigFileFolder,
    listConfigDirectoryEntries,
  };
};
