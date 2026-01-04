import {
  type AnthropicProviderOptions,
  createAnthropic,
} from '@ai-sdk/anthropic';
import type { LanguageModelV3 } from '@ai-sdk/provider';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import {
  type ChatTransport,
  convertToModelMessages,
  streamText,
  type UIMessage,
} from 'ai';
import type { LLMProvider, ModelResponseOptions } from '../LLMProvider';
import type { ModelResponseOptionAdaptor } from '../ModelResponseOptionAdaptor';
import { AnthropicResponseOptionAdaptor } from './AnthropicResponseOptionAdaptor';
import {
  type AnthropicModelId,
  AnthropicModelIdSchema,
} from './anthropic-models';

type AnthropicProviderConstructorOptions = {
  apiKey: string;
};

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic';
  private apiKey: string;
  private client: ReturnType<typeof createAnthropic>;
  readonly responseOptionAdaptor: ModelResponseOptionAdaptor<AnthropicProviderOptions>;

  constructor({ apiKey }: AnthropicProviderConstructorOptions) {
    this.apiKey = apiKey;
    this.client = createAnthropic({ apiKey: this.apiKey });
    this.responseOptionAdaptor = new AnthropicResponseOptionAdaptor();
  }

  public static async validateConnection(apiKey: string): Promise<boolean> {
    return fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
    })
      .then(response => response.ok)
      .catch(error => {
        console.error('Error validating Anthropic API key:', error);
        return false;
      });
  }

  public async validateConnection(): Promise<boolean> {
    return AnthropicProvider.validateConnection(this.apiKey);
  }

  public getModel(modelId: string): LanguageModelV3 {
    // throw error if modelId is not valid
    const parsedModelId: AnthropicModelId =
      AnthropicModelIdSchema.parse(modelId);
    return this.client(parsedModelId);
  }

  public getSpeechModel(_modelId: string): null {
    return null;
  }

  public createTextStream(
    model: LanguageModelV3,
    options?: ModelResponseOptions,
  ): ChatTransport<UIMessage<UIMessageMetadata>> {
    const modelId = model.modelId;
    const providerName = this.name;
    const providerOptions = this.responseOptionAdaptor.adapt(modelId, options);

    return {
      sendMessages: async ({ messages, abortSignal }) => {
        return await streamText({
          abortSignal,
          model: model,
          messages: await convertToModelMessages(messages),
          providerOptions: {
            anthropic: providerOptions,
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
}
