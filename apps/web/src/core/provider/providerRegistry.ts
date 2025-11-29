import type { LLMProviderName } from './all-models';
import type { LLMProvider } from './LLMProvider';

class ProviderRegistry {
  private providers: Record<string, LLMProvider> = {};

  public register(name: LLMProviderName, provider: LLMProvider) {
    this.providers[name] = provider;
  }

  public get(name: LLMProviderName): LLMProvider | null {
    return this.providers[name] ?? null;
  }

  public has(name: LLMProviderName): boolean {
    return this.providers[name] !== undefined;
  }
}

/**
 * @description register AI providers.
 * This is a singleton instance.
 *
 * @example
 * providerRegistry.register('openai', new OpenAILLMProvider({ apiKey: 'your-api-key' }));
 * providerRegistry.has('openai') => true
 * providerRegistry.get('openai') => OpenAILLMProvider
 */
export const providerRegistry = new ProviderRegistry();
