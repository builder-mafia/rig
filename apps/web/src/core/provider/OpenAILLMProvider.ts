import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import {
  type ChatTransport,
  convertToModelMessages,
  streamText,
  type UIMessage,
} from 'ai';
import { z } from 'zod';
import type { CreateTransportOptions, LLMProvider } from './LLMProvider';

export const OpenAiModelIdSchema = z.enum([
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  'gpt-5',
  'gpt-5-mini',
  'gpt-5-nano',
  'gpt-5-codex',
  'gpt-5.1-codex',
  'gpt-5.1-codex-mini',
  'gpt-5.1',
]);

export type OpenAiModelId = z.infer<typeof OpenAiModelIdSchema>;

type OpenAILLMProviderOptions = {
  apiKey: string;
};

export class OpenAILLMProvider implements LLMProvider {
  readonly name = 'openai';
  private apiKey: string;

  /**
   * apiKey must be registered after validation check.
   */
  constructor({ apiKey }: OpenAILLMProviderOptions) {
    this.apiKey = apiKey;
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
    options?: CreateTransportOptions,
  ): ChatTransport<UIMessage> {
    return {
      sendMessages: async ({ messages }) => {
        return await streamText({
          model: model,
          messages: convertToModelMessages(messages),
          // providerOptions: createProviderOptions(service, model),
          onError: err => {
            throw new Error(
              err instanceof Error
                ? err.message
                : 'Failed to fetch the chat response.',
            );
          },
        }).toUIMessageStream();
      },
      reconnectToStream: () => {
        throw new Error('Not implemented');
      },
    };
  }
}
