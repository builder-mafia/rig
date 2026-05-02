export type StorageConfigFile = {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  iconUrl: string | null;
  groupId: string | null;
  order: number;
  createdAt: number;
  updatedAt: number;
};

export type StorageGroup = {
  id: string;
  name: string;
  iconUrl: string | null;
  order: number;
  createdAt: number;
  updatedAt: number;
};

export type ScannedFile = {
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
