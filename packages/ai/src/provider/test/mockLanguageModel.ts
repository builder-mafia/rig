import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3StreamPart,
} from '@ai-sdk/provider';
import { convertArrayToReadableStream, MockLanguageModelV3 } from 'ai/test';

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
}: CreateMockModelOptions): LanguageModelV3 => {
  const messageId = '0';

  const textDelta: LanguageModelV3StreamPart[] = textDeltaChunks.map(text => ({
    type: 'text-delta',
    id: messageId,
    delta: text,
  }));

  return new MockLanguageModelV3({
    modelId,
    provider,
    doStream: async options => ({
      stream: convertArrayToReadableStream([
        { type: 'text-start', id: messageId },
        ...textDelta,
        { type: 'text-end', id: messageId },
        {
          type: 'finish',
          finishReason: { raw: undefined, unified: finishReason },
          logprobs: undefined,
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
      ]),
    }),
  });
};
