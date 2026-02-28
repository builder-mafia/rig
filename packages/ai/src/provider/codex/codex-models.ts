import { z } from 'zod/v3';

export const CodexModelIdSchema = z.enum([
  'gpt-5.3-codex',
  'gpt-5.2-codex',
  'gpt-5.1-codex',
  'gpt-5.1-codex-max',
  'gpt-5.1-codex-mini',
  'gpt-5-codex',
]);

export type CodexModelId = z.infer<typeof CodexModelIdSchema>;
