import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { ChatTransport, UIMessage } from 'ai';
import type z from 'zod';
import type { ReasoningEffortSchema, ReasoningSummarySchema } from '@/idb/db';
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
  getModel: (modelId: string) => LanguageModelV2;
  createTransport: (
    model: LanguageModelV2,
    options?: ModelResponseOptions,
  ) => ChatTransport<UIMessage>;
}
