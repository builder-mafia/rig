import type {
  LanguageModelV3,
  LanguageModelV3StreamPart,
} from '@ai-sdk/provider';
import { convertArrayToReadableStream, MockLanguageModelV3 } from 'ai/test';
import { delay } from 'es-toolkit';

type CreateMockModelOptions = {
  modelId?: string;
  provider?: string;
  textDeltaChunks: string[];
  finishReason?: 'stop' | 'error';
  chunkDelay?: number;
};

const createDelayedStream = <T>(
  items: T[],
  delayMs: number,
): ReadableStream<T> => {
  return new ReadableStream({
    async start(controller) {
      for (const item of items) {
        await delay(delayMs);
        controller.enqueue(item);
      }
      controller.close();
    },
  });
};

export const createMockLanguageModel = ({
  modelId = 'mock-model-id',
  provider = 'mock-provider',
  textDeltaChunks,
  finishReason = 'stop',
  chunkDelay,
}: CreateMockModelOptions): LanguageModelV3 => {
  const messageId = '0';

  const textDelta: LanguageModelV3StreamPart[] = textDeltaChunks.map(text => ({
    type: 'text-delta',
    id: messageId,
    delta: text,
  }));

  const allParts: LanguageModelV3StreamPart[] = [
    { type: 'text-start', id: messageId },
    ...textDelta,
    { type: 'text-end', id: messageId },
    {
      type: 'finish',
      finishReason: { raw: undefined, unified: finishReason },
      usage: {
        inputTokens: {
          total: 3,
          noCache: 3,
          cacheRead: undefined,
          cacheWrite: undefined,
        },
        outputTokens: {
          total: 10,
          text: 10,
          reasoning: undefined,
        },
      },
    },
  ];

  return new MockLanguageModelV3({
    modelId,
    provider,
    doStream: async () => ({
      stream:
        chunkDelay != null
          ? createDelayedStream(allParts, chunkDelay)
          : convertArrayToReadableStream(allParts),
    }),
  });
};
