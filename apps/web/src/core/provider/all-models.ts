import z from 'zod';
import { GoogleAiModelIdSchema } from './GoogleLLMProvider';
import { OpenAiModelIdSchema } from './OpenAILLMProvider';

export const LLMProviderNameSchema = z.enum(['google', 'openai']);
export type LLMProviderName = z.infer<typeof LLMProviderNameSchema>;

export const AllModelIdsSchema = z.enum([
  ...GoogleAiModelIdSchema.options,
  ...OpenAiModelIdSchema.options,
]);

export type AllModelIds = z.infer<typeof AllModelIdsSchema>;

export const MODEL_IDS_PER_PROVIDER: Record<LLMProviderName, AllModelIds[]> = {
  google: GoogleAiModelIdSchema.options,
  openai: OpenAiModelIdSchema.options,
};
