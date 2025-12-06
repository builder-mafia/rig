import type { LanguageModelV2 } from '@ai-sdk/provider';
import {
  type ChatTransport,
  convertToModelMessages,
  streamText,
  type UIMessage,
} from 'ai';
import type { LLMProvider } from '../LLMProvider';
import { createMockLanguageModel } from './mockLanguageModel';

class MockProvider implements LLMProvider {
  public name: string;
  private readonly textDeltaChunks: string[];
  private readonly modelIds: string[];

  constructor({
    textDeltaChunks,
    modelIds,
    providerName = 'mock-provider',
  }: { textDeltaChunks: string[]; modelIds: string[]; providerName?: string }) {
    this.textDeltaChunks = textDeltaChunks;
    this.modelIds = modelIds;
    this.name = providerName;
  }

  validateConnection() {
    return Promise.resolve(true);
  }

  getModel(modelId: string): LanguageModelV2 {
    if (!this.modelIds.includes(modelId)) {
      throw new Error(`Model ID ${modelId} is not supported by this provider`);
    }

    return createMockLanguageModel({
      modelId,
      textDeltaChunks: this.textDeltaChunks,
    });
  }

  createTransport(model: LanguageModelV2): ChatTransport<UIMessage> {
    return {
      sendMessages: async ({ messages }) => {
        return await streamText({
          model: model,
          messages: convertToModelMessages(messages),
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

export const createMockProvider = ({
  textDeltaChunks,
  modelIds,
  providerName,
}: {
  textDeltaChunks: string[];
  modelIds: string[];
  providerName?: string;
}): MockProvider => {
  return new MockProvider({ textDeltaChunks, modelIds, providerName });
};
