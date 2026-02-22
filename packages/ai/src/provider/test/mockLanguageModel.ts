import type {
  LanguageModelV3,
  LanguageModelV3StreamPart,
} from '@ai-sdk/provider';
import { convertArrayToReadableStream, MockLanguageModelV3 } from 'ai/test';
import { delay } from 'es-toolkit';

type CreateMockModelOptions = {
  modelId?: string;
  provider?: string;
  textDeltaChunks: (string | Error)[];
  finishReason?: 'stop' | 'error';
  chunkDelay?: number;
};

const createMockStream = <T>(
  items: T[],
  options?: { error?: Error; delayMs?: number },
): ReadableStream<T> => {
  const { error, delayMs } = options ?? {};

  if (!error && delayMs == null) {
    return convertArrayToReadableStream(items);
  }

  return new ReadableStream({
    async start(controller) {
      for (const item of items) {
        if (delayMs != null) await delay(delayMs);
        controller.enqueue(item);
      }
      if (error) {
        if (delayMs != null) await delay(delayMs);
        controller.error(error);
      } else {
        controller.close();
      }
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

  const errorIndex = textDeltaChunks.findIndex(
    chunk => chunk instanceof Error,
  );
  const hasError = errorIndex !== -1;
  const stringChunks = (
    hasError ? textDeltaChunks.slice(0, errorIndex) : textDeltaChunks
  ) as string[];
  const error = hasError
    ? (textDeltaChunks[errorIndex] as Error)
    : undefined;

  const textDelta: LanguageModelV3StreamPart[] = stringChunks.map(text => ({
    type: 'text-delta',
    id: messageId,
    delta: text,
  }));

  const allParts: LanguageModelV3StreamPart[] = [];

  if (stringChunks.length > 0) {
    allParts.push({ type: 'text-start', id: messageId });
    allParts.push(...textDelta);
  }

  if (!hasError) {
    if (stringChunks.length === 0) {
      allParts.push({ type: 'text-start', id: messageId });
    }
    allParts.push({ type: 'text-end', id: messageId });
    allParts.push({
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
    });
  }

  return new MockLanguageModelV3({
    modelId,
    provider,
    doStream: async () => ({
      stream: createMockStream(allParts, { error, delayMs: chunkDelay }),
    }),
  });
};
