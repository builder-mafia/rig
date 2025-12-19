import {
  ChatFacade,
  ChatFacadeManager,
  generateUIMessage,
  LLMProviderNameSchema,
  providerRegistry,
} from '@allin/chat';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { UIMessage } from 'ai';
import { getDefaultStore, useSetAtom } from 'jotai';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { dbAtoms } from '@/idb/db-store';
import { assert } from '@/utils/assert';

/**
 * It must be declared as a constant to avoid infinite re-rendering.
 */
const EMPTY_MESSAGES: UIMessage[] = [];

type UseChatOptions = {
  id: string;
};

const store = getDefaultStore();

/**
 * if chatFacade is changed, the uiMessages and status will be updated.
 */
export const useChat = <UI_MESSAGE extends UIMessage>({
  id,
}: UseChatOptions) => {
  const addMessage = useSetAtom(dbAtoms.addMessageAtom);

  /**
   * useSuspenseQuery's only purpose is to trigger the suspense.
   */
  const { data: chatFacade } = useSuspenseQuery<ChatFacade>({
    queryKey: ['chat-facade', id],
    queryFn: async () => {
      if (ChatFacadeManager.getInstance().hasChatFacade(id)) {
        return ChatFacadeManager.getInstance().getChatFacade(id);
      }

      const allMessages = await store.get(dbAtoms.allMessagesAtom);
      const channels = await store.get(dbAtoms.allChannelsAtom);

      const currentChannel = channels.find(channel => channel.id === id);
      const messages = allMessages.filter(message => message.channelId === id);

      assert(currentChannel, 'useChat: channel is not found.');
      assert(messages, 'useChat: channel messages are not found.');

      // in db, providerName is stored as string.
      // so we need to parse it to LLMProviderName.
      const safeProviderName = LLMProviderNameSchema.parse(
        currentChannel.providerName,
      );
      const provider = providerRegistry.get(safeProviderName);

      const facade = new ChatFacade({
        id,
        provider,
        modelId: currentChannel.model,
        responseOptions: {
          reasoning: currentChannel.reasoningEffort,
          reasoningSummary: currentChannel.reasoningSummary,
        },
        messages,
      });

      ChatFacadeManager.getInstance().setChatFacade(id, facade);

      return facade;
    },
  });

  useEffect(() => {
    const subscription1 = chatFacade.getOnBeforeSend$().subscribe(message => {
      addMessage(chatFacade.getId(), message);
    });

    const subscription2 = chatFacade
      .getOnFinish$()
      .subscribe(({ message, isAbort, isDisconnect, isError }) => {
        if (isAbort || isDisconnect || isError) {
          return;
        }

        addMessage(chatFacade.getId(), message);
      });

    return () => {
      subscription1.unsubscribe();
      subscription2.unsubscribe();
    };
  }, [chatFacade, addMessage]);

  const subscribeToMessages = useCallback(
    (onChange: () => void) => {
      const subscription = chatFacade.getUiMessages$().subscribe(onChange);
      return () => {
        subscription.unsubscribe();
      };
    },
    [chatFacade],
  );

  const uiMessages = useSyncExternalStore(
    subscribeToMessages,
    () => chatFacade.getUiMessages() ?? EMPTY_MESSAGES,
    () => chatFacade.getUiMessages() ?? EMPTY_MESSAGES,
  );

  const subscribeToStatus = useCallback(
    (onChange: () => void) => {
      const subscription = chatFacade.getStatus$().subscribe(onChange);
      return () => {
        subscription.unsubscribe();
      };
    },
    [chatFacade],
  );

  const status = useSyncExternalStore(
    subscribeToStatus,
    () => chatFacade.getStatus() ?? 'error',
    () => chatFacade.getStatus() ?? 'error',
  );

  const stop = useCallback(() => {
    chatFacade.stop();
  }, [chatFacade]);

  const sendMessage = useCallback(
    (message: UI_MESSAGE & { role: 'user' }) => {
      return chatFacade.sendMessage(message);
    },
    [chatFacade],
  );

  const setSystemPrompt = useCallback(
    (prompt: string) => {
      chatFacade.addSystemMessage(generateUIMessage('system', prompt));
    },
    [chatFacade],
  );

  return {
    uiMessages,
    status,
    stop,
    sendMessage,
    setSystemPrompt,
  };
};
