import type { LanguageModelV2, SpeechModelV2 } from '@ai-sdk/provider';
import type {
  ReasoningEffortSchema,
  ReasoningSummarySchema,
} from '@allin/db-schema';
import type { ChatTransport, UIMessage } from 'ai';
import type { z } from 'zod';
import type { ModelResponseOptionAdaptor } from './ModelResponseOptionAdaptor';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';

export type ReasoningEffort = z.infer<typeof ReasoningEffortSchema>;
export type ReasoningSummary = z.infer<typeof ReasoningSummarySchema>;

export type ModelResponseOptions = {
  reasoning?: ReasoningEffort;
  reasoningSummary?: ReasoningSummary;
};

export interface LLMProvider {
  readonly name: string;
  readonly responseOptionAdaptor: ModelResponseOptionAdaptor;

  validateConnection: () => Promise<boolean>;
  getModel: (modelId: string) => LanguageModelV2;
  /**
   * If the provider supports TTS (text-to-speech), return the SpeechModelV2.
   * Otherwise, return null.
   */
  getSpeechModel: (modelId: string) => SpeechModelV2 | null;
  createTransport: (
    model: LanguageModelV2,
    options?: ModelResponseOptions,
  ) => ChatTransport<UIMessage<UIMessageMetadata>>;
}
