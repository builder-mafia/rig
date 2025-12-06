import type { UIMessage } from 'ai';
import { assert } from '@/utils/assert';

export const getAssistantMessageText = (message: UIMessage): string => {
  assert(
    message.role === 'assistant',
    `getAssistantMessageText: message is not a assistant message. role: ${message.role}`,
  );

  return message.parts.reduce((acc, part) => {
    if (part.type === 'text') {
      return acc + part.text;
    }
    return acc;
  }, '');
};

export const getUserMessageText = (message: UIMessage): string => {
  assert(
    message.role === 'user',
    `getUserMessageText: message is not a user message. role: ${message.role}`,
  );

  return message.parts.reduce((acc, part) => {
    if (part.type === 'text') {
      return acc + part.text;
    }
    return acc;
  }, '');
};
