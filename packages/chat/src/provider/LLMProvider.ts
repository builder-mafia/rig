import type { LanguageModelV3, SpeechModelV3 } from '@ai-sdk/provider';
import type {
  ReasoningEffortSchema,
  ReasoningSummarySchema,
} from '@allin/db-schema';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import type { ChatTransport, UIMessage } from 'ai';
import type { z } from 'zod/v3';
import type { ModelResponseOptionAdaptor } from './ModelResponseOptionAdaptor';

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
  getModel: (modelId: string) => LanguageModelV3;
  /**
   * If the provider supports TTS (text-to-speech), return the SpeechModelV2.
   * Otherwise, return null.
   */
  getSpeechModel: (modelId: string) => SpeechModelV3 | null;
  createTextStream: (
    model: LanguageModelV3,
    options?: ModelResponseOptions,
  ) => ChatTransport<UIMessage<UIMessageMetadata>>;
}
