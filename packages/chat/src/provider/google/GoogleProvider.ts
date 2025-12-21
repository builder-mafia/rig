import {
  createGoogleGenerativeAI,
  type GoogleGenerativeAIProviderOptions,
} from '@ai-sdk/google';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import {
  type ChatTransport,
  convertToModelMessages,
  streamText,
  type UIMessage,
} from 'ai';
import type { LLMProvider, ModelResponseOptions } from '../LLMProvider';
import type { ModelResponseOptionAdaptor } from '../ModelResponseOptionAdaptor';
import type { UIMessageMetadata } from '../metadata';
import { GoogleResponseOptionAdaptor } from './GoogleResponseOptionAdaptor';
import { type GoogleAiModelId, GoogleAiModelIdSchema } from './google-models';

type GoogleProviderOptions = {
  apiKey: string;
};

export class GoogleProvider implements LLMProvider {
  readonly name = 'google';
  private apiKey: string;
  private client: ReturnType<typeof createGoogleGenerativeAI>;
  readonly responseOptionAdaptor: ModelResponseOptionAdaptor<GoogleGenerativeAIProviderOptions>;

  constructor({ apiKey }: GoogleProviderOptions) {
    this.apiKey = apiKey;
    this.client = createGoogleGenerativeAI({ apiKey: this.apiKey });
    this.responseOptionAdaptor = new GoogleResponseOptionAdaptor();
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
    return GoogleProvider.validateConnection(this.apiKey);
  }

  public getModel(modelId: string): LanguageModelV2 {
    // throw error if modelId is not valid
    const parsedModelId: GoogleAiModelId = GoogleAiModelIdSchema.parse(modelId);
    return this.client(parsedModelId);
  }

  public getSpeechModel(_modelId: string): null {
    return null;
  }

  public createTransport(
    model: LanguageModelV2,
    options?: ModelResponseOptions,
  ): ChatTransport<UIMessage<UIMessageMetadata>> {
    const modelId = model.modelId;
    const providerName = this.name;
    const providerOptions = this.responseOptionAdaptor.adapt(modelId, options);

    return {
      sendMessages: async ({ messages }) => {
        return await streamText({
          model: model,
          messages: convertToModelMessages(messages),
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
