import type { LLMProviderName } from './all-models';
import { GoogleLLMProvider } from './GoogleLLMProvider';
import { OpenAILLMProvider } from './OpenAILLMProvider';

export interface ValidateApiKeyParams {
  apiKey: string;
  providerName: LLMProviderName;
}

export const validateApiKey = async ({
  apiKey,
  providerName,
}: ValidateApiKeyParams): Promise<boolean> => {
  if (!apiKey) return false;

  switch (providerName) {
    case 'openai':
      return OpenAILLMProvider.validateConnection(apiKey);
    case 'google':
      return GoogleLLMProvider.validateConnection(apiKey);
    default:
      throw new Error(`validateApiKey: Unsupported provider: ${providerName}`);
  }
};
