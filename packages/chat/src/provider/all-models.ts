import { z } from 'zod/v3';
import { AnthropicModelIdSchema } from './anthropic/anthropic-models';
import { GoogleAiModelIdSchema } from './google/google-models';
import { OpenAiModelIdSchema } from './openai/openai-models';

export const LLMProviderNameSchema = z.enum(['openai', 'google', 'anthropic']);
export type LLMProviderName = z.infer<typeof LLMProviderNameSchema>;

export const AllModelIdsSchema = z.enum([
  ...GoogleAiModelIdSchema.options,
  ...OpenAiModelIdSchema.options,
  ...AnthropicModelIdSchema.options,
]);

export type AllModelIds = z.infer<typeof AllModelIdsSchema>;

export const MODEL_IDS_PER_PROVIDER: Record<LLMProviderName, AllModelIds[]> = {
  google: GoogleAiModelIdSchema.options,
  openai: OpenAiModelIdSchema.options,
  anthropic: AnthropicModelIdSchema.options,
};
