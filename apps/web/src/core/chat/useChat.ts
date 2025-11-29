import type { ChatInit, UIMessage } from 'ai';
import { isEqual, noop } from 'es-toolkit';
import { useCallback, useRef, useSyncExternalStore } from 'react';
import { type ChatFacade, createChatFacade } from './ChatFacade';
import { ChatFacadeManager } from './ChatFacadeManager';
import type { CustomTransport } from './createTransport';

/**
 * It must be declared as a constant to avoid infinite re-rendering.
 */
const EMPTY_MESSAGES: UIMessage[] = [];

type UseChatOptions = {
  id: string;
  transport: CustomTransport;
  messages: UIMessage[];
  onFinish?: ChatInit<UIMessage>['onFinish'];
  onError?: ChatInit<UIMessage>['onError'];
  onData?: ChatInit<UIMessage>['onData'];
};

/**
 * if chatFacade is changed, the uiMessages and status will be updated.
 */
export const useChat = <UI_MESSAGE extends UIMessage>({
  id,
  transport,
  messages,
  ...options
}: UseChatOptions) => {
  const chatFacadeRef = useRef<ChatFacade>(
    ChatFacadeManager.getChatFacade(id) ??
      createChatFacade({
        id,
        messages,
        transport,
        onData: options.onData ?? noop,
        onFinish: options.onFinish ?? noop,
        onError: options.onError ?? noop,
      }),
  );

  console.group('useChat');
  console.log(chatFacadeRef.current.getLLM());
  console.log({
    provider: transport.metadata.provider,
    model: transport.metadata.model,
  });
  console.groupEnd();

  const shouldRecreateTransport =
    id !== chatFacadeRef.current.getId() ||
    !isEqual(
      {
        provider: transport.metadata.provider,
        model: transport.metadata.model,
      },
      chatFacadeRef.current.getLLM(),
    );

  console.log('shouldRecreateTransport', shouldRecreateTransport);
  if (shouldRecreateTransport) {
    chatFacadeRef.current.setTransport(transport);
  }

  const subscribeToMessages = useCallback((onChange: () => void) => {
    const subscription = chatFacadeRef.current
      .getUiMessages$()
      .subscribe(onChange);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const uiMessages = useSyncExternalStore(
    subscribeToMessages,
    () => chatFacadeRef.current.getUiMessages() ?? EMPTY_MESSAGES,
    () => chatFacadeRef.current.getUiMessages() ?? EMPTY_MESSAGES,
  );

  const subscribeToStatus = useCallback((onChange: () => void) => {
    const subscription = chatFacadeRef.current.getStatus$().subscribe(onChange);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const status = useSyncExternalStore(
    subscribeToStatus,
    () => chatFacadeRef.current.getStatus() ?? 'error',
    () => chatFacadeRef.current.getStatus() ?? 'error',
  );

  const stop = () => {
    chatFacadeRef.current.stop();
  };

  const sendMessage = (message: UI_MESSAGE & { role: 'user' }) => {
    return chatFacadeRef.current.sendMessage(message);
  };

  return {
    uiMessages,
    status,
    stop,
    sendMessage,
  };
};
