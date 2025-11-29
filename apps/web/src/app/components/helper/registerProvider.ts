import type z from 'zod';
import { GoogleLLMProvider } from '@/core/provider/GoogleLLMProvider';
import { OpenAILLMProvider } from '@/core/provider/OpenAILLMProvider';
import { providerRegistry } from '@/core/provider/providerRegistry';
import type { ConfigSchema } from '@/idb/db';

export const registerProvider = (config: z.infer<typeof ConfigSchema>) => {
  const { googleApiKey, openaiApiKey } = config;

  if (googleApiKey && !providerRegistry.has('google')) {
    providerRegistry.register(
      'google',
      new GoogleLLMProvider({ apiKey: googleApiKey }),
    );
  }

  if (openaiApiKey && !providerRegistry.has('openai')) {
    providerRegistry.register(
      'openai',
      new OpenAILLMProvider({ apiKey: openaiApiKey }),
    );
  }
};
