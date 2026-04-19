'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useService } from '@/business/ServiceContext';
import type {
  LocalPathCheckInput,
  LocalPathCheckResult,
  StorageConfigFile,
  StorageGroup,
} from '@/lib/gateway/config-file/types';

type ConfigFileGroupItem = {
  group: StorageGroup | null;
  configFiles: StorageConfigFile[];
};

export const useConfigFile = () => {
  const { configFileManager } = useService();
  const setConfigFile = useSetConfigFile();

  const subscribeToConfigFiles = useCallback(
    (onChange: () => void) => {
      const subscription = configFileManager.files$.subscribe(onChange);
      return () => subscription.unsubscribe();
    },
    [configFileManager],
  );

  const getConfigFilesSnapshot = useCallback(
    () => configFileManager.files,
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

  const fetchConfigFiles = useCallback(async () => {
    await configFileManager.fetchFiles();
  }, [configFileManager]);

  const fetchGroups = useCallback(async () => {
    await configFileManager.fetchGroups();
  }, [configFileManager]);

  const checkLocalPath = useCallback(
    async (input: LocalPathCheckInput): Promise<LocalPathCheckResult> => {
      return configFileManager.checkLocalPath(input);
    },
    [configFileManager],
  );

  const read = useCallback(
    async (path: string) => {
      return configFileManager.read(path);
    },
    [configFileManager],
  );

  const groupedConfigFiles = useMemo(() => {
    const groupedConfigFilesMap = new Map<string | null, StorageConfigFile[]>();

    for (const configFile of configFiles) {
      const current = groupedConfigFilesMap.get(configFile.groupId) ?? [];
      current.push(configFile);
      groupedConfigFilesMap.set(configFile.groupId, current);
    }

    const groupedConfigFiles: ConfigFileGroupItem[] = [];
    const ungroupedConfigFiles = groupedConfigFilesMap.get(null) ?? [];

    groupedConfigFiles.push({
      group: null,
      configFiles: ungroupedConfigFiles,
    });

    for (const group of groups) {
      groupedConfigFiles.push({
        group,
        configFiles: groupedConfigFilesMap.get(group.id) ?? [],
      });
    }

    for (const [groupId, groupedFiles] of groupedConfigFilesMap.entries()) {
      if (groupId === null) {
        continue;
      }

      const hasGroup = groups.some(group => group.id === groupId);
      if (hasGroup) {
        continue;
      }

      groupedConfigFiles[0].configFiles.push(...groupedFiles);
    }

    return groupedConfigFiles;
  }, [configFiles, groups]);

  return {
    configFiles,
    groups,
    groupedConfigFiles,
    fetchConfigFiles,
    fetchGroups,
    checkLocalPath,
    read,
    ...setConfigFile,
  };
};

export const useSetConfigFile = () => {
  const { configFileManager } = useService();

  const createConfigFile = useCallback(
    async (file: StorageConfigFile) => {
      return configFileManager.createConfigFile(file);
    },
    [configFileManager],
  );

  const createGroup = useCallback(
    async (params: StorageGroup) => {
      return configFileManager.createGroup(params);
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
        order?: number;
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
        order?: number;
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

  const write = useCallback(
    async (path: string, content: string) => {
      await configFileManager.write(path, content);
    },
    [configFileManager],
  );

  return {
    createConfigFile,
    createGroup,
    updateConfigFile,
    updateGroup,
    deleteConfigFile,
    deleteGroup,
    write,
  };
};
