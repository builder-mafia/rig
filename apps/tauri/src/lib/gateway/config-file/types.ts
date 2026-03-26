export type StorageConfigFile = {
  id: string;
  name: string;
  path: string;
  iconType: 'preset' | 'uploaded' | null;
  iconValue: string | null;
  createdAt: number;
  updatedAt: number;
};
