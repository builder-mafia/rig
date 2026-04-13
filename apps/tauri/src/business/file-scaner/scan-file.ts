import { configFileGateway } from '@/lib/gateway/config-file/configFileGateway';
import type { LocalPathCheckResult } from '@/lib/gateway/config-file/types';
import { TARGET_FILES } from './targetFiles';

const checkIfExistFile = async (
  path: string,
  fallbacks?: string[],
): Promise<LocalPathCheckResult> => {
  const res = await configFileGateway.checkLocalPath({
    path,
  });
  if (res.exists) {
    return res;
  }

  if (fallbacks) {
    for (const fallback of fallbacks) {
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
    resolvedPath: '',
  };
};

export type ScanFile = {
  groupId: string;
  name: string;
  path: string | string[];
  isDirectory: boolean;
  resolvedPath: string;
  exists: boolean;
};

export const scanFile = async (): Promise<ScanFile[]> => {
  return Promise.all(
    TARGET_FILES.map(async target => {
      const ret = await checkIfExistFile(
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
