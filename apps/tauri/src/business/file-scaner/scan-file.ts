import { configFileGateway } from '@/lib/gateway/config-file/configFileGateway';
import type { LocalPathCheckResult } from '@/lib/gateway/config-file/types';
import { TARGET_FILES } from './targetFiles';

const checkIfFileExist = async (
  path: string,
  fallbacks?: string[],
): Promise<LocalPathCheckResult> => {
  let lastCheckedPath = path;

  const res = await configFileGateway.checkLocalPath({
    path,
  });
  if (res.exists) {
    return res;
  }

  if (fallbacks) {
    for (const fallback of fallbacks) {
      lastCheckedPath = fallback;
      const res = await configFileGateway.checkLocalPath({
        path: fallback,
      });
      if (res.exists) {
        return res;
      }
    }
  }

  return {
    exists: false,
    resolvedPath: lastCheckedPath,
    createdAt: null,
    updatedAt: null,
  };
};

export type ScanFile = {
  groupId: string;
  name: string;
  path: string | string[];
  isDirectory: boolean;
  resolvedPath: string;
  exists: boolean;
  createdAt: number | null;
  updatedAt: number | null;
};

export const scanFile = async (): Promise<ScanFile[]> => {
  return Promise.all(
    TARGET_FILES.map(async target => {
      const ret = await checkIfFileExist(
        target.path instanceof Array ? target.path[0] : target.path,
        target.path instanceof Array ? target.path.slice(1) : undefined,
      );
      return {
        ...target,
        ...ret,
      };
    }),
  );
};
