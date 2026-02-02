'use client';

import type { LLMProviderName } from '@allin/ai';
import { generateUIMessage } from '@allin/ai';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import type { ChatStatus, UIMessage } from 'ai';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { TauriChatTransport } from '@/chat/tauri-chat-transport';
import { ChannelState } from './ChannelState';
import { ChatFacade, ChatFacadeManager } from './facade';
import {
  storageMessageToUiMessage,
  uiMessageToStorageMessage,
} from './storage/messageMapper';
import {
  appendMessage,
  getAgent,
  getAllAgents,
  getMessages,
  upsertMessage,
} from './storage/tauriStorageClient';
import type { StorageChannel } from './storage/types';

const EMPTY_MESSAGES: UIMessage<UIMessageMetadata>[] = [];

export function useChat(channel: StorageChannel | null) {
  const channelId = channel?.id ?? null;
  const [chatFacade, setChatFacade] = useState<ChatFacade | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!channelId) return;

    let cancelled = false;

    (async () => {
      try {
        if (ChatFacadeManager.getInstance().hasChatFacade(channelId)) {
          const existing =
            ChatFacadeManager.getInstance().getChatFacade(channelId);
          setChatFacade(existing);
          return;
        }

        const agentId = channel?.agentId ?? 'default';
        const agent = await getAgent(agentId).catch(async () => {
          const agents = await getAllAgents();
          if (agents.length === 0) {
            throw new Error('No agents found');
          }
          return agents[0];
        });

        const storageMessages = await getMessages(channelId);
        const uiMessages = storageMessages.map(storageMessageToUiMessage);

        const transport = new TauriChatTransport({
          providerName: agent.providerName as LLMProviderName,
          modelId: agent.model,
        });

        const facade = new ChatFacade({
          id: channelId,
          messages: uiMessages,
          transport,
          providerName: agent.providerName as LLMProviderName,
          modelId: agent.model,
        });

        if (agent.prompt?.trim()) {
          facade.addSystemMessage(generateUIMessage('system', agent.prompt));
        }

        ChatFacadeManager.getInstance().setChatFacade(channelId, facade);
        if (!cancelled) {
          setChatFacade(facade);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [channelId, channel?.agentId]);

  // Handle pending message auto-send after ChatFacade is ready
  useEffect(() => {
    if (!chatFacade) return;

    const pendingMessage = ChannelState.getInstance().getPendingMessage();
    if (pendingMessage) {
      ChannelState.getInstance().setPendingMessage(null);

      const msg = generateUIMessage(
        'user',
        pendingMessage,
      ) as UIMessage<UIMessageMetadata> & {
        role: 'user';
      };
      chatFacade.sendMessage(msg);
    }
  }, [chatFacade]);

  useEffect(() => {
    if (!chatFacade) return;

    const subscription1 = chatFacade.getOnBeforeSend$().subscribe(message => {
      const metadata: UIMessageMetadata = {
        createdAt: Date.now(),
      };
      const toSave: UIMessage<UIMessageMetadata> & { role: 'user' } = {
        ...message,
        metadata: {
          ...(message.metadata ?? {}),
          ...metadata,
        },
      };

      appendMessage(
        chatFacade.getId(),
        uiMessageToStorageMessage(toSave),
      ).catch(err => {
        console.error('appendMessage failed:', err);
      });
    });

    const subscription2 = chatFacade.finish$.subscribe(
      ({ message, isAbort, isDisconnect, isError }) => {
        const enrichedMessage: UIMessage<UIMessageMetadata> = {
          ...message,
          metadata: {
            ...(message.metadata ?? {}),
            provider: chatFacade.getProviderName(),
            modelId: chatFacade.getModelId(),
            isAborted: isAbort || undefined,
            isDisconnected: isDisconnect || undefined,
            isError: isError || undefined,
            errorMessage: isError ? chatFacade.getError()?.message : undefined,
          },
        };

        upsertMessage(
          chatFacade.getId(),
          uiMessageToStorageMessage(enrichedMessage),
        ).catch(err => {
          console.error('upsertMessage failed:', err);
        });
      },
    );

    return () => {
      subscription1.unsubscribe();
      subscription2.unsubscribe();
    };
  }, [chatFacade]);

  const subscribeToMessages = useCallback(
    (onChange: () => void) => {
      if (!chatFacade) return () => {};
      const subscription = chatFacade.getUiMessages$().subscribe(onChange);
      return () => {
        subscription.unsubscribe();
      };
    },
    [chatFacade],
  );

  const uiMessages = useSyncExternalStore(
    subscribeToMessages,
    () => chatFacade?.getUiMessages() ?? EMPTY_MESSAGES,
    () => chatFacade?.getUiMessages() ?? EMPTY_MESSAGES,
  );

  const subscribeToStatus = useCallback(
    (onChange: () => void) => {
      if (!chatFacade) return () => {};
      const subscription = chatFacade.getStatus$().subscribe(onChange);
      return () => {
        subscription.unsubscribe();
      };
    },
    [chatFacade],
  );

  const status: ChatStatus = useSyncExternalStore(
    subscribeToStatus,
    () => chatFacade?.getStatus() ?? 'ready',
    () => chatFacade?.getStatus() ?? 'ready',
  );

  const stop = useCallback(() => {
    if (!chatFacade) return;
    chatFacade.stop().catch(err => {
      console.error('stop failed:', err);
    });
  }, [chatFacade]);

  const sendText = useCallback(
    (text: string) => {
      if (!chatFacade) {
        throw new Error('ChatFacade is not ready');
      }

      const msg = generateUIMessage(
        'user',
        text,
      ) as UIMessage<UIMessageMetadata> & {
        role: 'user';
      };
      return chatFacade.sendMessage(msg);
    },
    [chatFacade],
  );

  const isReady = useMemo(
    () => Boolean(chatFacade) && !error,
    [chatFacade, error],
  );

  return {
    uiMessages,
    status,
    stop,
    sendText,
    isReady,
    error,
  };
}
