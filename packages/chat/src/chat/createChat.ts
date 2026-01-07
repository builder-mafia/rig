import { Chat, type UIMessage } from '@ai-sdk/react';
import type { ChatInit } from 'ai';

export const createChat = <T extends UIMessage>(
  chatInit: ChatInit<T>,
): Chat<T> => {
  return new Chat(chatInit);
};
