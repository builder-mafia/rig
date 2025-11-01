import type { UIMessage } from 'ai';
import { useCallback, useSyncExternalStore } from 'react';
import type { ChatFacade } from './ChatFacade';

export const useChat = <UI_MESSAGE extends UIMessage>(
  chatFacade: ChatFacade<UI_MESSAGE>,
) => {
  const uiMessages = useSyncExternalStore(
    useCallback(
      onChange => {
        const subscription = chatFacade
          .getUiMessageStore()
          .uiMessages$()
          .subscribe(onChange);
        return () => {
          subscription.unsubscribe();
        };
      },
      [chatFacade],
    ),
    () => chatFacade.getUiMessageStore().getUiMessages(),
    () => chatFacade.getUiMessageStore().getUiMessages(),
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
    () => chatFacade.getStatus$().getValue(),
    () => chatFacade.getStatus$().getValue(),
  );

  const stop = async () => {
    await chatFacade.getChatTransport().stop();
  };

  const sendMessage = (message: UI_MESSAGE & { role: 'user' }) => {
    return chatFacade.getChatTransport().sendMessage(message);
  };

  return {
    uiMessages,
    status,
    stop,
    sendMessage,
  };
};
