import type { ConfigSchema } from '@allin/db-schema';
import { match } from 'ts-pattern';
import type { z } from 'zod';
import type { LLMProviderName } from '@/core/provider/all-models';

/**
 * @example
 * isProviderEnabled('openai', config) => true // when openai api key is set
 * isProviderEnabled('google', config) => false // when google api key is not set
 */
export const isProviderEnabled = (
  providerName: LLMProviderName,
  config: z.infer<typeof ConfigSchema>,
) => {
  return match(providerName)
    .with('google', () => !!config.apiKeys.google)
    .with('openai', () => !!config.apiKeys.openai)
    .exhaustive();
};
