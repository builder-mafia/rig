import { match } from 'ts-pattern';
import type z from 'zod';
import {
  type LLMProviderName,
  LLMProviderNameSchema,
} from '@/core/provider/all-models';
import { GoogleProvider } from '@/core/provider/google/GoogleProvider';
import { OpenAiProvider } from '@/core/provider/openai/OpenAiProvider';
import { providerRegistry } from '@/core/provider/providerRegistry';
import type { ConfigSchema } from '@/idb/db';

export const registerProvider = (config: z.infer<typeof ConfigSchema>) => {
  const { apiKeys } = config;

  LLMProviderNameSchema.options.forEach((providerName: LLMProviderName) => {
    const apiKey = apiKeys[providerName];

    if (!apiKey || providerRegistry.has(providerName)) {
      return;
    }

    match(providerName)
      .with('google', () => {
        providerRegistry.register('google', new GoogleProvider({ apiKey }));
      })
      .with('openai', () => {
        providerRegistry.register('openai', new OpenAiProvider({ apiKey }));
      })
      .exhaustive();
  });
};
