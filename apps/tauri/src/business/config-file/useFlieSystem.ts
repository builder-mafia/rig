import { useCallback } from 'react';
import { useService } from '../ServiceContext';

export const useFileSystem = () => {
  const { configFileManager } = useService();

  const readFile = useCallback(
    async (path: string) => {
      return configFileManager.read(path);
    },
    [configFileManager],
  );

  const writeFile = useCallback(
    async (path: string, content: string) => {
      return configFileManager.write(path, content);
    },
    [configFileManager],
  );

  return { readFile, writeFile };
};
