import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import {
  type ChatTransport,
  convertToModelMessages,
  streamText,
  type UIMessage,
} from 'ai';
import type { CreateTransportOptions, LLMProvider } from '../LLMProvider';
import { type GoogleAiModelId, GoogleAiModelIdSchema } from './google-models';

type GoogleLLMProviderOptions = {
  apiKey: string;
};

export class GoogleLLMProvider implements LLMProvider {
  readonly name = 'google';
  private apiKey: string;

  constructor({ apiKey }: GoogleLLMProviderOptions) {
    this.apiKey = apiKey;
  }

  public static async validateConnection(apiKey: string): Promise<boolean> {
    return fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
    )
      .then(response => response.ok)
      .catch(error => {
        console.error('Error validating Google AI API key:', error);
        return false;
      });
  }

  public async validateConnection(): Promise<boolean> {
    return GoogleLLMProvider.validateConnection(this.apiKey);
  }

  public getModel(modelId: string): LanguageModelV2 {
    // throw error if modelId is not valid
    const parsedModelId: GoogleAiModelId = GoogleAiModelIdSchema.parse(modelId);
    return createGoogleGenerativeAI({ apiKey: this.apiKey })(parsedModelId);
  }

  public createTransport(
    model: LanguageModelV2,
    options?: CreateTransportOptions,
  ): ChatTransport<UIMessage> {
    const modelId = model.modelId;
    const providerName = this.name;

    const supportsThinking =
      modelId &&
      [
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-3-pro-preview',
      ].includes(modelId);

    const providerOptions = supportsThinking
      ? {
          thinkingConfig: {
            thinkingBudget: 8192,
            includeThoughts: false,
          },
        }
      : undefined;

    return {
      sendMessages: async ({ messages }) => {
        return await streamText({
          model: model,
          messages: convertToModelMessages(messages),
          providerOptions,
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
              };
            } else if (part.type === 'finish') {
              return {
                inputTokens: part.totalUsage.inputTokens,
                outputTokens: part.totalUsage.outputTokens,
                reasoningTokens: part.totalUsage.reasoningTokens,
                cachedInputTokens: part.totalUsage.cachedInputTokens,
                totalTokens: part.totalUsage.totalTokens,
              };
            }
          },
        });
      },
      reconnectToStream: () => {
        throw new Error('Not implemented');
      },
    };
  }
}
