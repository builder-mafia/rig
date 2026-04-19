'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useService } from '@/business/ServiceContext';
import type {
  LocalPathCheckInput,
  LocalPathCheckResult,
  StorageGroup,
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

  const subscribeToGroups = useCallback(
    (onChange: () => void) => {
      const subscription = configFileManager.groups$.subscribe(onChange);
      return () => subscription.unsubscribe();
    },
    [configFileManager],
  );

  const getGroupsSnapshot = useCallback(
    () => configFileManager.groups,
    [configFileManager],
  );

  const groups = useSyncExternalStore(
    subscribeToGroups,
    getGroupsSnapshot,
    getGroupsSnapshot,
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

  const fetchGroups = useCallback(async () => {
    await configFileManager.fetchGroups();
  }, [configFileManager]);

  const createGroup = useCallback(
    async (params: { name: string; iconUrl: string | null }) => {
      return configFileManager.createGroup(params);
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

  const updateGroup = useCallback(
    async (
      groupId: string,
      params: {
        name?: string;
        iconUrl?: string | null;
      },
    ) => {
      await configFileManager.updateGroup(groupId, params);
    },
    [configFileManager],
  );

  const deleteGroup = useCallback(
    async (groupId: string) => {
      await configFileManager.deleteGroup(groupId);
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
    groups,
    selectedConfigFile,
    fetchConfigFiles,
    fetchGroups,
    createConfigFile,
    createGroup,
    checkLocalPath,
    updateConfigFile,
    updateGroup,
    deleteConfigFile,
    deleteGroup,
    selectConfigFile,
    readConfigFile,
    writeConfigFile,
  };
};
