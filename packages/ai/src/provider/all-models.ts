import { z } from 'zod/v3';
import { AnthropicModelIdSchema } from './anthropic/anthropic-models';
import { CodexModelIdSchema } from './codex/codex-models';
import { GoogleAiModelIdSchema } from './google/google-models';
import { OpenAiModelIdSchema } from './openai/openai-models';
import { VercelModelIdSchema } from './vercel/vercel-models';

export const ProviderIdSchema = z.enum([
  'openai',
  'google',
  'anthropic',
  'codex',
  'vercel',
]);
export type ProviderId = z.infer<typeof ProviderIdSchema>;
export const PROVIDER_IDS = ProviderIdSchema.options;

export const AllModelIdsSchema = z.enum([
  ...GoogleAiModelIdSchema.options,
  ...OpenAiModelIdSchema.options,
  ...AnthropicModelIdSchema.options,
  ...CodexModelIdSchema.options,
  ...VercelModelIdSchema.options,
]);

export type AllModelIds = z.infer<typeof AllModelIdsSchema>;

export const MODEL_IDS_PER_PROVIDER: Record<ProviderId, AllModelIds[]> = {
  google: GoogleAiModelIdSchema.options,
  openai: OpenAiModelIdSchema.options,
  anthropic: AnthropicModelIdSchema.options,
  codex: CodexModelIdSchema.options,
  vercel: VercelModelIdSchema.options,
};
