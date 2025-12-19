import type {
  LanguageModelV2,
  LanguageModelV2StreamPart,
} from '@ai-sdk/provider';
import { convertArrayToReadableStream, MockLanguageModelV2 } from 'ai/test';

type CreateMockModelOptions = {
  /**
   * @example 'gpt-4.1', 'gpt-5.1', 'gemini'...
   * @default 'mock-model-id'
   */
  modelId?: string;
  /**
   * @exmaple 'openai', 'google', 'anthropic'...
   * @default 'mock-provider'
   */
  provider?: string;
  /**
   * @description text delta chunks to be streamed
   * @example ['Hello, world!', 'How are you?', 'I am fine, thank you!']
   */
  textDeltaChunks: string[];
  finishReason?: 'stop' | 'error';
};

// https://github.com/vercel/ai/blob/31842e1b86ebba37bda5c596c78e7552cb02f013/examples/ai-core/src/stream-text/mock.ts#L17
export const createMockLanguageModel = ({
  modelId = 'mock-model-id',
  provider = 'mock-provider',
  textDeltaChunks,
  finishReason = 'stop',
}: CreateMockModelOptions): LanguageModelV2 => {
  const messageId = '0';

  const textDelta: LanguageModelV2StreamPart[] = textDeltaChunks.map(text => ({
    type: 'text-delta',
    id: messageId,
    delta: text,
  }));

  return new MockLanguageModelV2({
    modelId,
    provider,
    doStream: async () => ({
      stream: convertArrayToReadableStream([
        { type: 'text-start', id: messageId },
        ...textDelta,
        { type: 'text-end', id: messageId },
        {
          type: 'finish',
          finishReason,
          usage: {
            inputTokens: 3,
            outputTokens: 10,
            totalTokens: 13,
          },
        },
      ]),
    }),
  });
};
