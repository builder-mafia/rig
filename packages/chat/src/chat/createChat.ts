import { Chat } from '@ai-sdk/react';
import type { ChatInit, ChatTransport, UIMessage } from 'ai';
import type { UIMessageMetadata } from '../provider/metadata';

type ChatUiMessage = UIMessage<UIMessageMetadata>;

export type CreateChatOptions = Pick<
  ChatInit<ChatUiMessage>,
  'id' | 'onData' | 'onFinish' | 'onError' | 'messages'
> & {
  transport: ChatTransport<ChatUiMessage>;
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
