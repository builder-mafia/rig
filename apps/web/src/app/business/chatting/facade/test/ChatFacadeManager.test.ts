import { beforeEach, describe, expect, it } from 'vitest';
import { createMockTransport } from '@allin/chat';
import { ChatFacade } from '../ChatFacade';
import { ChatFacadeManager } from '../ChatFacadeManager';

describe('ChatFacadeManager', () => {
  beforeEach(() => {
    ChatFacadeManager.getInstance()
      .getAllChatFacadeIds()
      .forEach(id => {
        ChatFacadeManager.getInstance().deleteChatFacadeById(id);
      });
  });

  it('registers a chat facade instance in the manager', () => {
    const chatFacade = new ChatFacade({
      id: 'chat-facade-id',
      messages: [],
      transport: createMockTransport({
        textDeltaChunks: ['Hello', 'World'],
        modelId: 'mock-model-id',
      }),
      providerName: 'openai',
      modelId: 'mock-model-id',
    });

    ChatFacadeManager.getInstance().setChatFacade('chat-facade-id', chatFacade);

    expect(
      ChatFacadeManager.getInstance().hasChatFacade('chat-facade-id'),
    ).toBe(true);
    expect(
      ChatFacadeManager.getInstance().getChatFacade('chat-facade-id'),
    ).toBe(chatFacade);
    expect(ChatFacadeManager.getInstance().getAllChatFacadeIds()).toEqual([
      'chat-facade-id',
    ]);
  });

  it('throws an error if the chat facade is not found', () => {
    expect(() => {
      ChatFacadeManager.getInstance().getChatFacade('chat-facade-id');
    }).toThrow(
      'ChatFacadeManager: chat facade with id chat-facade-id is not found.',
    );
  });
});
