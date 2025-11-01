import type {
  ChatInit,
  ChatStatus,
  HttpChatTransportInitOptions,
  UIMessage,
} from 'ai';
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { ChatManager } from '@/core/ChatManager';

type UseChatReturn<UI_MESSAGE extends UIMessage> = {
  sendMessage: (message: UI_MESSAGE & { role: 'user' }) => Promise<void>;
  uiMessages: UI_MESSAGE[];
  setUiMessages: (
    messages: UI_MESSAGE[] | ((prev: UI_MESSAGE[]) => UI_MESSAGE[]),
  ) => void;
  setMessageContext: (
    messages: UI_MESSAGE[] | ((prev: UI_MESSAGE[]) => UI_MESSAGE[]),
  ) => void;
  stop: () => void;
  // error: Error | null;
  // tokenUsage: {
  //   [type: string]: number;
  // };
  status: ChatStatus;
};

type UseChatParams<UI_MESSAGE extends UIMessage> = {
  id: string;
  experimental_throttle?: number;
  onBeforeSend?: ({
    message,
  }: {
    message: UI_MESSAGE & { role: 'user' };
  }) => void;
} & ChatInit<UI_MESSAGE> &
  HttpChatTransportInitOptions<UI_MESSAGE>;

export const useChat = <UI_MESSAGE extends UIMessage>({
  id,
  api,
  experimental_throttle,
  onBeforeSend,
  onData,
  onFinish,
  onError,
}: UseChatParams<UI_MESSAGE>): UseChatReturn<UI_MESSAGE> => {
  const chat = useMemo(() => {
    return (
      ChatManager.getChatById<UI_MESSAGE>(id) ??
      ChatManager.new<UI_MESSAGE>({
        id,
        experimental_throttle: experimental_throttle ?? 50,
        api,
        onData,
        onError,
        onFinish,
      })
    );
  }, [id]);

  const sendMessage = useCallback(
    (message: UI_MESSAGE & { role: 'user' }) => {
      onBeforeSend?.({ message });
      return chat.sendMessage(message);
    },
    [chat, onBeforeSend],
  );

  const uiMessages = useSyncExternalStore(
    chat.subscribeMessages.bind(chat),
    () => chat.getUiMessages(),
    () => chat.getUiMessages(),
  );

  const status = useSyncExternalStore<ChatStatus>(
    chat.subscribeStatus.bind(chat),
    () => chat.getStatus(),
    () => chat.getStatus(),
  );

  const setUiMessages = useCallback(
    (messages: UI_MESSAGE[] | ((prev: UI_MESSAGE[]) => UI_MESSAGE[])) => {
      chat.setUiMessages(messages);
    },
    [chat],
  );

  const setMessageContext = useCallback(
    (messages: UI_MESSAGE[] | ((prev: UI_MESSAGE[]) => UI_MESSAGE[])) =>
      chat.setContextMessages(messages),
    [chat],
  );

  const stop = async () => {
    await chat.stop();
  };

  return {
    sendMessage,
    uiMessages,
    setUiMessages,
    setMessageContext,
    stop,
    status,
  };
};
