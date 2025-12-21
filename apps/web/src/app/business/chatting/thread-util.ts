import {
  type AssistantMessage,
  isAssistantMessage,
  isUserMessage,
  type UserMessage,
} from '@allin/chat';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import type { UIMessage } from 'ai';

export type Thread = {
  userMessage: UserMessage;
  assistantMessage?: AssistantMessage;
};

/**
 * Possible thread formats:
 * [user message] // when an assistant message was not generated due to an error
 * [user message, assistant message]
 * Any other forms indicate an unexpected error or a serious bug.
 */
export const messagesToThreads = (
  messages: UIMessage<UIMessageMetadata>[],
): Thread[] => {
  const threads = messages.reduce(
    (acc, message) => {
      if (isUserMessage(message)) {
        acc.push({ userMessage: message });
      }
      if (isAssistantMessage(message)) {
        const recentThread = acc[acc.length - 1];
        if (recentThread.userMessage && !recentThread.assistantMessage) {
          recentThread.assistantMessage = message;
        }
      }

      return acc;
    },
    [] as unknown as Thread[],
  );

  return threads;
};
