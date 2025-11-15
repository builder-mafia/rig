import type { UIMessage } from 'ai';
import { useCallback, useSyncExternalStore } from 'react';
import type { ChatFacade } from './ChatFacade';

export const useChat = <UI_MESSAGE extends UIMessage>(
  chatFacade: ChatFacade<UI_MESSAGE>,
) => {
  const uiMessages = useSyncExternalStore(
    useCallback(
      onChange => {
        const subscription = chatFacade.getUiMessages$().subscribe(onChange);
        return () => {
          subscription.unsubscribe();
        };
      },
      [chatFacade],
    ),
    () => chatFacade.getUiMessages(),
    () => chatFacade.getUiMessages(),
  );

  const status = useSyncExternalStore(
    useCallback(
      onChange => {
        const subscription = chatFacade.getStatus$().subscribe(onChange);
        return () => {
          subscription.unsubscribe();
        };
      },
      [chatFacade],
    ),
    () => chatFacade.getStatus(),
    () => chatFacade.getStatus(),
  );

  const stop = () => {
    chatFacade.stop();
  };

  const sendMessage = (message: UI_MESSAGE & { role: 'user' }) => {
    return chatFacade.sendMessage(message);
  };

  return {
    uiMessages,
    status,
    stop,
    sendMessage,
  };
};
