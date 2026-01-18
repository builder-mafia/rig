import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  GoogleAiModelIdSchema,
  GoogleResponseOptionAdaptor,
  type ModelResponseOptions,
} from '@allin/chat';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import {
  type ChatTransport,
  convertToModelMessages,
  streamText,
  type UIMessage,
} from 'ai';

export function createGoogleTransport(
  modelId: string,
  apiKey: string,
  options?: ModelResponseOptions,
): ChatTransport<UIMessage<UIMessageMetadata>> {
  const parsedModelId = GoogleAiModelIdSchema.parse(modelId);
  const client = createGoogleGenerativeAI({ apiKey });
  const model = client(parsedModelId);
  const adaptor = new GoogleResponseOptionAdaptor();
  const providerOptions = adaptor.adapt(modelId, options);

  return {
    sendMessages: async ({ messages, abortSignal }) => {
      return await streamText({
        abortSignal,
        model,
        messages: await convertToModelMessages(messages),
        providerOptions: {
          google: providerOptions,
        },
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
              provider: 'google',
              createdAt: Date.now(),
            } as UIMessageMetadata;
          } else if (part.type === 'finish') {
            return {
              inputTokens: part.totalUsage.inputTokens,
              outputTokens: part.totalUsage.outputTokens,
              reasoningTokens: part.totalUsage.reasoningTokens,
              cachedInputTokens: part.totalUsage.cachedInputTokens,
              totalTokens: part.totalUsage.totalTokens,
            } as UIMessageMetadata;
          }
        },
      });
    },
    reconnectToStream: () => {
      throw new Error('Not implemented');
    },
  };
}
