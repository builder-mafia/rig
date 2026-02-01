'use client';

import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import type { UIMessage } from 'ai';
import type { StorageMessage } from './types';

export type ChatUiMessage = UIMessage<UIMessageMetadata>;

export function storageMessageToUiMessage(
  message: StorageMessage,
): ChatUiMessage {
  const metadata: UIMessageMetadata = {
    ...(message.metadata ?? {}),
    createdAt: message.createdAt,
  };

  return {
    id: message.id,
    role: message.role as ChatUiMessage['role'],
    parts: message.parts as ChatUiMessage['parts'],
    metadata,
  };
}

export function uiMessageToStorageMessage(
  message: ChatUiMessage,
): StorageMessage {
  const createdAt = message.metadata?.createdAt ?? Date.now();

  return {
    id: message.id,
    role: message.role,
    parts: message.parts as unknown[],
    metadata: message.metadata,
    createdAt,
  };
}
