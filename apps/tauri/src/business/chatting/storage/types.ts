import type { UIMessageMetadata } from '@allin/message-metadata-schema';

export type StorageChannel = {
  id: string;
  agentId: string | null;
  title: string | null;
  description: string | null;
  pin: string | null;
  createdAt: number;
  updatedAt: number;
};

export type StorageMessage = {
  id: string;
  role: string;
  parts: unknown[];
  metadata?: UIMessageMetadata;
  createdAt: number;
  isSummary?: boolean;
  compactedAt?: number;
};

export type StorageAgent = {
  id: string;
  name: string;
  providerName: string;
  model: string;
  prompt: string | null;
  createdAt: number;
  updatedAt: number;
};

export type StorageAppSettings = {
  lastUsedProvider: string | null;
  lastUsedModel: string | null;
  updatedAt: number;
};
