import { z } from 'zod/v3';

export const AnthropicModelIdSchema = z.enum([
  'claude-sonnet-4-20250514',
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
]);

export type AnthropicModelId = z.infer<typeof AnthropicModelIdSchema>;
export const ANTHROPIC_MODELS = AnthropicModelIdSchema.options;
