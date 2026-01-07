import {
  generateUIMessage,
  LLMProviderNameSchema,
  providerRegistry,
} from '@allin/chat';
import { ChatFacade, ChatFacadeManager } from './facade';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { UIMessage } from 'ai';
import { merge } from 'es-toolkit';
import { getDefaultStore, useSetAtom } from 'jotai';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { dbAtoms } from '@/idb/db-store';
import { assert } from '@/utils/assert';
import { isMessagesConsistent } from './consistency-check';
import { handleExceptionOnOpenAi } from './open-ai-exception-handling';

/**
 * It must be declared as a constant to avoid infinite re-rendering.
 */
const EMPTY_MESSAGES: UIMessage<UIMessageMetadata>[] = [];

type UseChatOptions = {
  id: string;
};

const store = getDefaultStore();

/**
 * if chatFacade is changed, the uiMessages and status will be updated.
 */
export const useChat = <UI_MESSAGE extends UIMessage<UIMessageMetadata>>({
  id,
}: UseChatOptions) => {
  const addMessageOnDB = useSetAtom(dbAtoms.addMessageAtom);
  const deleteMessageOnDB = useSetAtom(dbAtoms.deleteMessageAtom);
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

      console.log('valid', isMessagesConsistent(messages));
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
    // save user message to db before sending
    const subscription1 = chatFacade.getOnBeforeSend$().subscribe(message => {
      const metadata: UIMessageMetadata = {
        createdAt: Date.now(),
      };
      addMessageOnDB(
        chatFacade.getId(),
        merge(message, {
          metadata,
        }),
      );
    });

    // save assistant response to db after finishing
    const subscription2 = chatFacade
      .getOnFinish$()
      .subscribe(({ message, isAbort, isDisconnect, isError }) => {
        const isAbnormalFinish = isAbort || isDisconnect || isError;
        let messageToSave: UIMessage<UIMessageMetadata> = message;

        if (chatFacade.getProviderName() === 'openai') {
          messageToSave = handleExceptionOnOpenAi(messageToSave);
        }

        if (isAbnormalFinish) {
          // when streaming is finished with error,
          // we add error metadata to the message.
          // and replace the context message and ui message to show the error.
          const error = chatFacade.getError();
          const metadataAboutError: UIMessageMetadata = {
            isError: isError,
            isDisconnected: isDisconnect,
            isAborted: isAbort,
            errorMessage: error?.message,
          };
          messageToSave = merge(message, {
            metadata: metadataAboutError,
          });

          // the reason we replace the context message is for handling openai exception. (see handleExceptionOnOpenAi)
          chatFacade.replaceContextMessage(messageToSave);
          // the reason we upsert the ui message is for showing the error message to the user.
          // because basicallly the uiMessage is updated in only when message is streaming. (see `@allin/chat`)
          chatFacade.upsertUiMessage(messageToSave);
        }

        addMessageOnDB(chatFacade.getId(), messageToSave);
      });

    return () => {
      subscription1.unsubscribe();
      subscription2.unsubscribe();
    };
  }, [chatFacade, addMessageOnDB]);

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

  const regenerate = useCallback(
    (messageId: string) => {
      deleteMessageOnDB(messageId);
      return chatFacade.regenerateMessage(messageId);
    },
    [chatFacade],
  );

  return {
    uiMessages,
    status,
    stop,
    regenerate,
    sendMessage,
    setSystemPrompt,
  };
};
