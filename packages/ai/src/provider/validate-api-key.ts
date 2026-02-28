import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { match } from 'ts-pattern';
import type { ProviderId } from './all-models';

type ValidateApiKeyParams = {
  apiKey: string;
  providerName: ProviderId;
};

const VALIDATION_MODELS: Record<Exclude<ProviderId, 'codex'>, string> = {
  openai: 'gpt-4o-mini',
  google: 'gemini-2.0-flash',
  anthropic: 'claude-3-5-haiku-latest',
};

export const validateApiKey = async ({
  apiKey,
  providerName,
}: ValidateApiKeyParams): Promise<boolean> => {
  // Codex uses OAuth authentication, not API keys
  if (providerName === 'codex') return true;

  try {
    const modelId = VALIDATION_MODELS[providerName];

    const model = match(providerName)
      .with('openai', () => createOpenAI({ apiKey })(modelId))
      .with('google', () => createGoogleGenerativeAI({ apiKey })(modelId))
      .with('anthropic', () => createAnthropic({ apiKey })(modelId))
      .exhaustive();

    await generateText({
      model,
      prompt: 'hi',
      maxOutputTokens: 1,
    });

    return true;
  } catch {
    return false;
  }
};
