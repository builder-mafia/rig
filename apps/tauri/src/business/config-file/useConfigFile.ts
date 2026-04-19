'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useService } from '@/business/ServiceContext';
import type {
  ConfigDirectoryEntry,
  LocalPathCheckInput,
  LocalPathCheckResult,
} from '@/lib/gateway/config-file/types';

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
    await configFileManager.fetchFiles();
  }, [configFileManager]);

  const createConfigFile = useCallback(
    async (params: {
      name: string;
      path: string;
      isDirectory: boolean;
      iconUrl: string | null;
      groupId: string | null;
    }) => {
      return configFileManager.createConfigFile(params);
    },
    [configFileManager],
  );

  const checkLocalPath = useCallback(
    async (input: LocalPathCheckInput): Promise<LocalPathCheckResult> => {
      return configFileManager.checkLocalPath(input);
    },
    [configFileManager],
  );

  const updateConfigFile = useCallback(
    async (
      configFileId: string,
      params: {
        name?: string;
        path?: string;
        isDirectory?: boolean;
        iconUrl?: string | null;
        groupId?: string | null;
      },
    ) => {
      await configFileManager.updateConfigFile(configFileId, params);
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

  return {
    configFiles,
    selectedConfigFile,
    fetchConfigFiles,
    createConfigFile,
    checkLocalPath,
    updateConfigFile,
    deleteConfigFile,
    selectConfigFile,
    readConfigFile,
    writeConfigFile,
  };
};
