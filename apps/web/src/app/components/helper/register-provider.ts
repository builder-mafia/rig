import { match } from 'ts-pattern';
import type z from 'zod';
import {
  type LLMProviderName,
  LLMProviderNameSchema,
} from '@/core/provider/all-models';
import { GoogleLLMProvider } from '@/core/provider/GoogleLLMProvider';
import { OpenAILLMProvider } from '@/core/provider/OpenAILLMProvider';
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
        providerRegistry.register('google', new GoogleLLMProvider({ apiKey }));
      })
      .with('openai', () => {
        providerRegistry.register('openai', new OpenAILLMProvider({ apiKey }));
      })
      .exhaustive();
  });
};
