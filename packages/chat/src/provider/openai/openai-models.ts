import z from 'zod';

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
