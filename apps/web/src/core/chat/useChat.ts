import type { UIMessage } from 'ai';
import { noop } from 'es-toolkit';
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { Nullable } from '@/utils/nullable';
import type { ChatFacade } from './ChatFacade';

/**
 * It must be declared as a constant to avoid infinite re-rendering.
 */
const EMPTY_MESSAGES: UIMessage[] = [];

/**
 * if chatFacade is changed, the uiMessages and status will be updated.
 */
export const useChat = <UI_MESSAGE extends UIMessage>(
  chatFacade: Nullable<ChatFacade<UI_MESSAGE>>,
) => {
  const isInitialized = useMemo(() => !!chatFacade, [chatFacade]);

  const uiMessages = useSyncExternalStore(
    useCallback(
      onChange => {
        if (!chatFacade) {
          return noop;
        }
        const subscription = chatFacade.getUiMessages$().subscribe(onChange);
        return () => {
          subscription.unsubscribe();
        };
      },
      [chatFacade],
    ),
    () => chatFacade?.getUiMessages() ?? EMPTY_MESSAGES,
    () => chatFacade?.getUiMessages() ?? EMPTY_MESSAGES,
  );

  const status = useSyncExternalStore(
    useCallback(
      onChange => {
        if (!chatFacade) {
          return noop;
        }
        const subscription = chatFacade.getStatus$().subscribe(onChange);
        return () => {
          subscription.unsubscribe();
        };
      },
      [chatFacade],
    ),
    () => (chatFacade ? chatFacade.getStatus() : 'error'),
    () => (chatFacade ? chatFacade.getStatus() : 'error'),
  );

  const stop = () => {
    if (!chatFacade) {
      return;
    }
    chatFacade.stop();
  };

  const sendMessage = (message: UI_MESSAGE & { role: 'user' }) => {
    if (!chatFacade) {
      return;
    }
    return chatFacade.sendMessage(message);
  };

  return {
    uiMessages,
    status,
    stop,
    sendMessage,
    isInitialized,
  };
};
