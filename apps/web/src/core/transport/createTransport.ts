import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import {
  type ChatTransport,
  convertToModelMessages,
  streamText,
  type UIMessage,
} from 'ai';
import type { Service, ServiceModelMap } from './ai-model';

/**
 * @description create transport
 *
 * @example
 * createTransport('api-key', 'goolge', 'gemini-2.5-pro');
 */
export const createTransport = <S extends Service>(
  apiKey: string,
  service: S,
  model: ServiceModelMap[S],
): ChatTransport<UIMessage> => {
  const createModel = (service: S, model: ServiceModelMap[S]) => {
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
