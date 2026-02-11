'use client';

import type { ProviderId } from '@allin/ai';
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
import { AgentManager } from '@/business/agent/AgentManager';
import { TauriChatTransport } from '@/business/chatting/tauri-chat-transport';
import { agentGateway } from '@/lib/gateway/agent/agentGateway';
import type { StorageChannel } from '@/lib/gateway/channel/types';
import { messageGateway } from '@/lib/gateway/message/messageGateway';
import { ChannelManager } from './ChannelManager';
import { ChatFacade, ChatFacadeManager } from './facade';

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
        const agent = await agentGateway.get(agentId).catch(async () => {
          const agents = await agentGateway.getAll();
          if (agents.length === 0) {
            throw new Error('No agents found');
          }
          return agents[0];
        });

        const uiMessages = await messageGateway.getAll(channelId);

        const transport = new TauriChatTransport({
          providerName: agent.providerName as ProviderId,
          modelId: agent.model,
        });

        const facade = new ChatFacade({
          id: channelId,
          messages: uiMessages,
          transport,
          providerName: agent.providerName as ProviderId,
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

  // Consume the pending message once ChatFacade is initialized.
  // When a channel is created with a message (e.g., from the home screen),
  // the message is temporarily stored in ChannelManager because ChatFacade
  // doesn't exist yet at that point. This effect picks it up and sends it.
  useEffect(() => {
    if (!chatFacade) return;

    const pendingMessage = ChannelManager.getInstance().pendingMessage;
    if (pendingMessage) {
      ChannelManager.getInstance().setPendingMessage(null);

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

    const sub = AgentManager.getInstance().activeAgentId$.subscribe(
      activeAgentId => {
        const activeAgent = AgentManager.getInstance().activeAgent;
        if (!activeAgentId || !activeAgent) return;

        const transport = new TauriChatTransport({
          providerName: activeAgent.providerName as ProviderId,
          modelId: activeAgent.model,
        });
        chatFacade.updateTransport(
          transport,
          activeAgent.providerName as ProviderId,
          activeAgent.model,
        );
      },
    );

    return () => sub.unsubscribe();
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
      messageGateway.append(chatFacade.getId(), toSave).catch(err => {
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

        messageGateway
          .upsert(chatFacade.getId(), enrichedMessage)
          .catch(err => {
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
