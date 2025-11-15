import type { LLMProvider } from '../chat/ai-model';

export interface ValidateApiKeyParams {
  apiKey: string;
  provider: LLMProvider;
}

export const validateApiKey = async ({
  apiKey,
  provider,
}: ValidateApiKeyParams): Promise<boolean> => {
  if (!apiKey) return false;

  let url = '';
  const headers: HeadersInit = {};

  if (provider === 'openai') {
    url = 'https://api.openai.com/v1/models';
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (provider === 'google') {
    url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  } else {
    console.error(`Unsupported provider: ${provider}`);
    return false;
  }

  try {
    const response = await fetch(url, { headers });
    return response.ok;
  } catch (error) {
    console.error(`Error validating API key for ${provider}:`, error);
    return false;
  }
};
