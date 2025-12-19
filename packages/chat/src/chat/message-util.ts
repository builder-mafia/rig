import type { UIMessage } from 'ai';
import { v4 } from 'uuid';
import { assert } from '../utils/assert';

export type UserMessage = UIMessage & {
  role: 'user';
};

export type AssistantMessage = UIMessage & {
  role: 'assistant';
};

export const isUserMessage = (message: UIMessage): message is UserMessage => {
  return message.role === 'user';
};

export const isAssistantMessage = (
  message: UIMessage,
): message is AssistantMessage => {
  return message.role === 'assistant';
};

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

export const generateUIMessage = <
  UI_MESSAGE extends UIMessage,
  Role extends UI_MESSAGE['role'],
>(
  role: Role,
  content: string,
  id: string = v4(),
) => {
  return {
    role,
    id,
    parts: [
      {
        type: 'text',
        text: content,
      },
    ],
  } as UI_MESSAGE & { role: Role };
};
