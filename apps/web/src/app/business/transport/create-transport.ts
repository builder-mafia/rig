import type { LLMProviderName, ModelResponseOptions } from '@allin/chat';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import type { ChatTransport, UIMessage } from 'ai';
import { match } from 'ts-pattern';
import { createAnthropicTransport } from './anthropic-transport';
import { createGoogleTransport } from './google-transport';
import { createOpenAiTransport } from './openai-transport';

export function createTransport(
  providerName: LLMProviderName,
  modelId: string,
  apiKey: string,
  options?: ModelResponseOptions,
): ChatTransport<UIMessage<UIMessageMetadata>> {
  return match(providerName)
    .with('anthropic', () =>
      createAnthropicTransport(modelId, apiKey, options),
    )
    .with('google', () => createGoogleTransport(modelId, apiKey, options))
    .with('openai', () => createOpenAiTransport(modelId, apiKey, options))
    .exhaustive();
}
