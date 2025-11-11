import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import {
  type ChatTransport,
  convertToModelMessages,
  streamText,
  type UIMessage,
} from 'ai';
import type { AiService, AiServiceModelMap } from './ai-model';

/**
 * @description create transport
 *
 * @example
 * createTransport('api-key', 'goolge', 'gemini-2.5-pro');
 */
export const createTransport = <S extends AiService>(
  apiKey: string,
  service: S,
  model: AiServiceModelMap[S],
): ChatTransport<UIMessage> => {
  const createModel = (service: S, model: AiServiceModelMap[S]) => {
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

  return {
    sendMessages: async ({ messages }) => {
      return await streamText({
        model: createModel(service, model),
        messages: convertToModelMessages(messages),
        providerOptions: {
          google: {
            thinkingConfig: {
              thinkingBudget: 8192,
              includeThoughts: true,
            },
          },
        },
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
