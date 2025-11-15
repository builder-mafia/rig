import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import {
  type ChatTransport,
  convertToModelMessages,
  streamText,
  type UIMessage,
} from 'ai';
import type { LLMModelNameMap, LLMProvider } from './ai-model';

type Feature = {
  thinking?: boolean;
  webSearch?: boolean;
};

/**
 * @description create transport
 *
 * @example
 * createTransport('api-key', 'goolge', 'gemini-2.5-pro');
 */
export const createTransport = <S extends LLMProvider>(
  apiKey: string,
  service: S,
  model: LLMModelNameMap[S],
  features?: Feature,
): ChatTransport<UIMessage> => {
  const createModel = (service: S, model: LLMModelNameMap[S]) => {
    if (service === 'google') {
      return createGoogleGenerativeAI({
        apiKey,
      })(model);
    } else if (service === 'openai') {
      return createOpenAI({
        apiKey,
      })(model);
    } else {
      throw new Error(`Invalid Parameters: ${service}, ${model}`);
    }
  };

  const createProviderOptions = (service: S, model: LLMModelNameMap[S]) => {
    if (
      service === 'google' &&
      ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'].includes(
        model,
      )
    ) {
      // thinking is only supported in gemini-2.5 series. see: https://ai.google.dev/gemini-api/docs/thinking
      return {
        thinkingConfig: {
          thinkingBudget: 8192,
          includeThoughts: true,
        },
      };
    } else if (service === 'google') {
      return undefined;
    } else if (service === 'openai') {
      return undefined;
    } else {
      throw new Error(`Invalid Parameters: ${service}, ${model}`);
    }
  };

  return {
    sendMessages: async ({ messages }) => {
      return await streamText({
        model: createModel(service, model),
        messages: convertToModelMessages(messages),
        providerOptions: createProviderOptions(service, model),
        onError: err => {
          throw new Error(
            err instanceof Error
              ? err.message
              : 'Failed to fetch the chat response.',
          );
        },
      }).toUIMessageStream();
    },
    reconnectToStream: () => {
      throw new Error('Not implemented');
    },
  };
};
