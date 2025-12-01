import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  streamText,
  type ToolSet,
  type UIMessage,
} from 'ai';
import type { MessageMetadata } from './messageMetadata';

export const maxDuration = 30;

type CreateChatBody = {
  messages: UIMessage[];
};

const model =
  process.env.NODE_ENV === 'production' ? 'gpt-4.1' : 'gpt-4.1-mini';

export async function POST(req: Request) {
  const data = (await req.json()) as CreateChatBody;
  const { messages } = data;

  const result = streamText({
    model: openai(model),
    messages: convertToModelMessages(messages),
    onError: err => {
      console.error('Error occurred in /api/chat', err);
    },
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: ({ part }): MessageMetadata | undefined => {
      if (part.type === 'finish') {
        return {
          inputTokens: part.totalUsage.inputTokens,
          outputTokens: part.totalUsage.outputTokens,
          reasoningTokens: part.totalUsage.reasoningTokens,
          cachedInputTokens: part.totalUsage.cachedInputTokens,
          totalTokens: part.totalUsage.totalTokens,
        };
      }
    },
  });
}
