import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import {
  type ChatTransport,
  convertToModelMessages,
  streamText,
  type UIMessage,
} from 'ai';
import { delay } from 'es-toolkit';
import { createMockLanguageModel } from './mockLanguageModel';

export type CreateMockTransportOptions = {
  textDeltaChunks: (string | Error)[];
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
  const errorIndex = textDeltaChunks.findIndex(c => c instanceof Error);
  const hasError = errorIndex !== -1;

  if (hasError) {
    const stringChunks = textDeltaChunks.slice(0, errorIndex) as string[];
    const error = textDeltaChunks[errorIndex] as Error;
    const messageId = '0';

    return {
      sendMessages: async () => {
        return new ReadableStream({
          async start(controller) {
            if (stringChunks.length > 0) {
              controller.enqueue({
                type: 'text-start',
                id: messageId,
              });
              for (const chunk of stringChunks) {
                if (chunkDelay != null) await delay(chunkDelay);
                controller.enqueue({
                  type: 'text-delta',
                  id: messageId,
                  delta: chunk,
                });
              }
            }
            if (chunkDelay != null) await delay(chunkDelay);
            controller.error(error);
          },
        });
      },
      reconnectToStream: () => {
        throw new Error('Not implemented');
      },
    };
  }

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
