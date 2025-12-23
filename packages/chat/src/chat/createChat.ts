import { Chat } from '@ai-sdk/react';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import type { ChatInit, ChatTransport, UIMessage } from 'ai';

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
