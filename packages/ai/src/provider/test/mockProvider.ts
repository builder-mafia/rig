import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import {
  type ChatTransport,
  convertToModelMessages,
  streamText,
  type UIMessage,
} from 'ai';
import { createMockLanguageModel } from './mockLanguageModel';

export type CreateMockTransportOptions = {
  textDeltaChunks: string[];
  modelId: string;
  providerName?: string;
  chunkDelay?: number;
};

export const createMockTransport = ({
  textDeltaChunks,
  modelId,
  providerName = 'mock-provider',
  chunkDelay,
}: CreateMockTransportOptions): ChatTransport<UIMessage<UIMessageMetadata>> => {
  const model = createMockLanguageModel({
    modelId,
    textDeltaChunks,
    chunkDelay,
  });

  return {
    sendMessages: async ({ messages }) => {
      return await streamText({
        model,
        messages: await convertToModelMessages(messages),
        onError: err => {
          throw new Error(
            err instanceof Error
              ? err.message
              : 'Failed to fetch the chat response.',
          );
        },
      }).toUIMessageStream({
        messageMetadata: ({ part }) => {
          if (part.type === 'start') {
            return {
              modelId,
              provider: providerName,
              createdAt: Date.now(),
            } as UIMessageMetadata;
          }
        },
      });
    },
    reconnectToStream: () => {
      throw new Error('Not implemented');
    },
  };
};
