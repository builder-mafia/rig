import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import type { LLMProviderName } from '@allin/chat';
import type { LanguageModel } from 'ai';
import { generateText } from 'ai';

type ValidateApiKeyParams = {
  apiKey: string;
  providerName: LLMProviderName;
};

const VALIDATION_MODELS: Record<LLMProviderName, string> = {
  openai: 'gpt-4o-mini',
  google: 'gemini-2.0-flash',
  anthropic: 'claude-3-5-haiku-latest',
};

export const validateApiKey = async ({
  apiKey,
  providerName,
}: ValidateApiKeyParams): Promise<boolean> => {
  try {
    const modelId = VALIDATION_MODELS[providerName];

    let model: LanguageModel;
    switch (providerName) {
      case 'openai':
        model = createOpenAI({ apiKey })(modelId);
        break;
      case 'google':
        model = createGoogleGenerativeAI({ apiKey })(modelId);
        break;
      case 'anthropic':
        model = createAnthropic({ apiKey })(modelId);
        break;
    }

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
