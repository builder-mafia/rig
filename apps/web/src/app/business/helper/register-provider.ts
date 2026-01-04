import {
  AnthropicProvider,
  GoogleProvider,
  type LLMProviderName,
  LLMProviderNameSchema,
  OpenAiProvider,
  providerRegistry,
} from '@allin/chat';
import type { ConfigSchema } from '@allin/db-schema';
import { match } from 'ts-pattern';
import type { z } from 'zod/v3';

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
      .with('anthropic', () => {
        providerRegistry.register(
          'anthropic',
          new AnthropicProvider({ apiKey }),
        );
      })
      .exhaustive();
  });
};
