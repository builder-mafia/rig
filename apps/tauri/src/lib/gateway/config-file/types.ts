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
