export type StorageConfigFile = {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  iconUrl: string | null;
  groupId: string | null;
  createdAt: number;
  updatedAt: number;
};

export type StorageGroup = {
  id: string;
  name: string;
  iconUrl: string | null;
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
};

export type LocalPathCheckResult = {
  resolvedPath: string;
  exists: boolean;
  createdAt: number | null;
  updatedAt: number | null;
};
