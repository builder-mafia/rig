import type { ProviderId } from '@allin/ai';
import type { ChatUiMessage } from '@/lib/gateway/message/messageMapper';
import { createMockTauriChatTransport } from '../transport/createMockTauriChatTransport';
import { ChatFacade } from './ChatFacade';

type CreateMockChatFacadeParams = {
  providerName?: ProviderId;
  modelId?: string;
  textDeltaChunks?: string[];
  initialMessages: ChatUiMessage[];
  chunkDelay?: number;
};

export const createMockChatFacade = ({
  textDeltaChunks,
  providerName,
  modelId,
  initialMessages,
  chunkDelay,
}: CreateMockChatFacadeParams) => {
  const transport = createMockTauriChatTransport({
    providerName: providerName ?? 'anthropic',
    modelId: modelId ?? 'mock-model',
    textDeltaChunks: textDeltaChunks ?? ['Hello', ' I am assistant.'],
    chunkDelay,
  });

  return new ChatFacade({
    id: 'chatFacadeTest',
    transport,
    messages: initialMessages,
  });
};
