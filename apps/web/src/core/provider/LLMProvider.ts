import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { ChatTransport, UIMessage } from 'ai';

export type CreateTransportOptions = {
  reasoning?: boolean;
  showReasoning?: boolean;
  webSearch?: boolean;
};

export interface LLMProvider {
  readonly name: string;

  validateConnection: () => Promise<boolean>;
  getModel: (modelId: string) => LanguageModelV2;
  createTransport: (
    model: LanguageModelV2,
    options?: CreateTransportOptions,
  ) => ChatTransport<UIMessage>;
}
