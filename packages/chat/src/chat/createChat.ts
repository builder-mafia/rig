import { Chat } from '@ai-sdk/react';
import type { ChatInit, ChatTransport, UIMessage } from 'ai';

export type CreateChatOptions = Pick<
  ChatInit<UIMessage>,
  'id' | 'onData' | 'onFinish' | 'onError' | 'messages'
> & {
  transport: ChatTransport<UIMessage>;
};

export const createChat = ({
  id,
  messages,
  onData,
  onFinish,
  onError,
  transport,
}: Required<CreateChatOptions>) => {
  const chat = new Chat({
    id,
    onData,
    onFinish,
    onError,
    transport,
    messages,
  });
  return chat;
};
