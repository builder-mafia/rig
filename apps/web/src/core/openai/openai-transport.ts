import { createOpenAI } from '@ai-sdk/openai';
import {
  type ChatTransport,
  convertToModelMessages,
  streamText,
  type UIMessage,
} from 'ai';
import type { OpenAiChatModel } from './openai-model';

type OpenAiTransportCreateOptions = {
  apiKey: string;
  model: OpenAiChatModel;
};

export const createOpenAiTransport = (
  options: OpenAiTransportCreateOptions,
) => {
  const openAIModel = createOpenAI({
    apiKey: options.apiKey,
  })(options.model);

  const transport: ChatTransport<UIMessage> = {
    sendMessages: async ({ messages }) => {
      const res = await streamText({
        model: openAIModel,
        messages: convertToModelMessages(messages),
        onError: err => {
          console.error('Error occurred in /api/chat', err);
        },
        onFinish: () => {
          console.log('finish');
        },
      });

      return res.toUIMessageStream();
    },
    reconnectToStream: () => {
      throw new Error('Not implemented');
    },
  };

  return transport;
};
