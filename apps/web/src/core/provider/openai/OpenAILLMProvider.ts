import {
  createOpenAI,
  type OpenAIResponsesProviderOptions,
} from '@ai-sdk/openai';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import {
  type ChatTransport,
  convertToModelMessages,
  streamText,
  type UIMessage,
} from 'ai';
import type { LLMProvider, ModelResponseOptions } from '../LLMProvider';
import type { ModelResponseOptionAdaptor } from '../ModelResponseOptionAdaptor';
import { OpenAiResponseOptionAdaptor } from './OpenAiResponseOptionAdaptor';
import { type OpenAiModelId, OpenAiModelIdSchema } from './openai-models';

type OpenAILLMProviderOptions = {
  apiKey: string;
};

export class OpenAILLMProvider implements LLMProvider {
  readonly name = 'openai';
  private apiKey: string;
  readonly responseOptionAdaptor: ModelResponseOptionAdaptor<OpenAIResponsesProviderOptions>;

  /**
   * apiKey must be registered after validation check.
   */
  constructor({ apiKey }: OpenAILLMProviderOptions) {
    this.apiKey = apiKey;
    this.responseOptionAdaptor = new OpenAiResponseOptionAdaptor();
  }

  public static async validateConnection(apiKey: string): Promise<boolean> {
    return fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
      .then(response => response.ok)
      .catch(error => {
        console.error('Error validating OpenAI API key:', error);
        return false;
      });
  }

  /**
   * check if previously validated api key becomes stale or not.
   */
  public async validateConnection(): Promise<boolean> {
    return OpenAILLMProvider.validateConnection(this.apiKey);
  }

  public getModel(modelId: string): LanguageModelV2 {
    // throw error if modelId is not valid
    const parsedModelId: OpenAiModelId = OpenAiModelIdSchema.parse(modelId);
    return createOpenAI({ apiKey: this.apiKey })(parsedModelId);
  }

  public createTransport(
    model: LanguageModelV2,
    options?: ModelResponseOptions,
  ): ChatTransport<UIMessage> {
    const modelId = model.modelId;
    const providerName = this.name;

    const providerOptions = this.responseOptionAdaptor.adapt(modelId, options);

    return {
      sendMessages: async ({ messages }) => {
        return await streamText({
          model: model,
          messages: convertToModelMessages(messages),
          providerOptions: {
            openai: providerOptions,
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
