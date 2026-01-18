import { generateUIMessage } from '@allin/ai';
import type { ChannelSchema } from '@allin/db-schema';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { UIMessage } from 'ai';
import { merge } from 'es-toolkit';
import { useSetAtom } from 'jotai';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type z from 'zod/v3';
import { dbAtoms, getConfig } from '@/idb/db-store';
import { createTransport } from '../transport';
import { ChatFacade, ChatFacadeManager } from './facade';
import { handleExceptionOnOpenAi } from './open-ai-exception-handling';
import { useAutoChannelTitle } from './useAutoChannelTitle';

const EMPTY_MESSAGES: UIMessage<UIMessageMetadata>[] = [];

export const useChat = <UI_MESSAGE extends UIMessage<UIMessageMetadata>>({
  id,
  title,
}: z.infer<typeof ChannelSchema>) => {
  const addMessageToDB = useSetAtom(dbAtoms.addMessageAtom);
  const deleteMessageFromDB = useSetAtom(dbAtoms.deleteMessageAtom);

  const { data: chatFacade } = useSuspenseQuery<ChatFacade>({
    queryKey: ['chat-facade', id],
    queryFn: async () => {
      if (ChatFacadeManager.getInstance().hasChatFacade(id)) {
        return ChatFacadeManager.getInstance().getChatFacade(id);
      }

      const {
        modelId,
        providerName,
        reasoningEffort,
        reasoningSummary,
        messages,
        apiKey,
      } = await getConfig();

      if (!apiKey) {
        throw new Error(`API key for ${providerName} is not configured.`);
      }

      const transport = createTransport(providerName, modelId, apiKey, {
        reasoning: reasoningEffort,
        reasoningSummary: reasoningSummary,
      });

      const facade = new ChatFacade({
        id,
        messages,
        transport,
        providerName,
        modelId,
      });

      ChatFacadeManager.getInstance().setChatFacade(id, facade);

      return facade;
    },
  });

  useEffect(() => {
    const subscription1 = chatFacade.getOnBeforeSend$().subscribe(message => {
      const metadata: UIMessageMetadata = {
        createdAt: Date.now(),
      };
      addMessageToDB(
        chatFacade.getId(),
        merge(message, {
          metadata,
        }),
      );
    });

    // save assistant response to DB after response is finished.
    const subscription2 = chatFacade.finish$.subscribe(
      ({ message, isAbort, isDisconnect, isError }) => {
        const isAbnormalFinish = isAbort || isDisconnect || isError;
        let messageToSave: UIMessage<UIMessageMetadata> = message;
        let isChanged = false;

        // remove message.metadata when openai request is aborted.
        // issue: https://github.com/vercel/ai/issues/8811
        if (chatFacade.getProviderName() === 'openai') {
          isChanged = true;
          messageToSave = handleExceptionOnOpenAi(messageToSave);
        }

        if (isAbnormalFinish) {
          isChanged = true;
          // apply error metadata to the message
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
        }

        // apply message changes to the context
        // (openai exception or abnormal finish)
        if (isChanged) {
          chatFacade.createOrReplaceMessage(messageToSave);
        }

        addMessageToDB(chatFacade.getId(), messageToSave);
      },
    );

    return () => {
      subscription1.unsubscribe();
      subscription2.unsubscribe();
    };
  }, [chatFacade, addMessageToDB]);

  useAutoChannelTitle(chatFacade, Boolean(title?.trim() ?? false));

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
      deleteMessageFromDB(messageId);
      return chatFacade.regenerateMessage(messageId);
    },
    [chatFacade, deleteMessageFromDB],
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
