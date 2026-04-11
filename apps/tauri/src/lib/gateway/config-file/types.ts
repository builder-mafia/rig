export type StorageConfigFile = {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  iconType: 'preset' | 'uploaded' | null;
  iconValue: string | null;
  createdAt: number;
  updatedAt: number;
};

export type ConfigDirectoryEntry = {
  name: string;
  path: string;
  isDirectory: boolean;
};

export type LocalPathCheckInput = {
  path: string;
  isDirectory: boolean;
};

export type LocalPathCheckResult = {
  path: string;
  resolvedPath: string;
  exists: boolean;
  matchesType: boolean;
  message: string | null;
};
