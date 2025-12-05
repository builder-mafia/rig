import { beforeEach, describe, expect, it } from 'vitest';
import { generateUIMessage } from '@/core/helper';
import { createMockProvider } from '@/core/provider/test/mockProvider';
import { ChatFacade } from '../ChatFacade';
import { ChatFacadeManager } from '../ChatFacadeManager';
import { getAssistantMessageText, getUserMessageText } from '../message-util';

describe('ChatFacade', () => {
  beforeEach(() => {
    ChatFacadeManager.getInstance()
      .getAllChatFacadeIds()
      .forEach(id => {
        ChatFacadeManager.getInstance().deleteChatFacadeById(id);
      });
  });

  it('sendMessage: returns an assistant message asynchronously', async () => {
    const chatFacade = new ChatFacade({
      id: 'chat-facade-id',
      messages: [],
      provider: createMockProvider({
        textDeltaChunks: ['Hello', ' I am assistant.'],
        modelIds: ['mock-model-id'],
      }),
      modelId: 'mock-model-id',
    });

    const response = await chatFacade.sendMessage(
      generateUIMessage('user', 'Say Hello World.'),
    );

    if (!response) {
      throw new Error('sendMessage: response is not defined');
    }

    expect(response.role).toBe('assistant');
    expect(getAssistantMessageText(response)).toBe('Hello I am assistant.');
  });

  it('getUiMessages$: should immediately emit current messages to new subscriber', () => {
    const chatFacade = new ChatFacade({
      id: 'chat-facade-id',
      messages: [
        generateUIMessage('user', 'Hi I am user.'),
        generateUIMessage('assistant', 'Hello I am assistant.'),
      ],
      provider: createMockProvider({
        textDeltaChunks: ['Hello', ' I am assistant.'],
        modelIds: ['mock-model-id'],
      }),
      modelId: 'mock-model-id',
    });

    chatFacade.getUiMessages$().subscribe(currentMessages => {
      expect(currentMessages[0].role).toBe('user');
      expect(getUserMessageText(currentMessages[0])).toBe('Hi I am user.');
      expect(currentMessages[1].role).toBe('assistant');
      expect(getAssistantMessageText(currentMessages[1])).toBe(
        'Hello I am assistant.',
      );
    });
  });

  it('getUiMessages$: emits initial and updated messages', () =>
    new Promise(done => {
      const chatFacade = new ChatFacade({
        id: 'chat-facade-id',
        messages: [],
        provider: createMockProvider({
          textDeltaChunks: ['Hello', ' I am assistant.'],
          modelIds: ['mock-model-id'],
        }),
        modelId: 'mock-model-id',
      });

      chatFacade.sendMessage(generateUIMessage('user', 'Say Hello World.'));

      let responseCount = 0;

      chatFacade.getUiMessages$().subscribe(currentMessages => {
        responseCount += 1;

        // 1st emit: only user message
        if (responseCount === 1) {
          expect(currentMessages.length).toBe(1);
          expect(currentMessages[0].role).toBe('user');
          expect(getUserMessageText(currentMessages[0])).toBe(
            'Say Hello World.',
          );
        }

        // 2nd emit and after: user + assistant message
        if (responseCount > 1) {
          expect(currentMessages[0].role).toBe('user');
          expect(getUserMessageText(currentMessages[0])).toBe(
            'Say Hello World.',
          );
          expect(currentMessages[1].role).toBe('assistant');
          expect(getAssistantMessageText(currentMessages[1])).toBe(
            'Hello I am assistant.',
          );
          done(true);
        }
      });
    }));

  it('updateModelId: updates Chat instance when model changes', () => {
    const chatFacade = new ChatFacade({
      id: 'chat-facade-id',
      messages: [],
      provider: createMockProvider({
        textDeltaChunks: ['Hello', ' I am assistant.'],
        modelIds: ['gpt-4', 'gpt-5'],
      }),
      modelId: 'gpt-4',
    });

    expect(chatFacade.getModelId()).toBe('gpt-4');
    const beforeChat = chatFacade.__getChat();

    chatFacade.updateModelId('gpt-5');

    expect(chatFacade.getModelId()).toBe('gpt-5');
    expect(chatFacade.__getChat()).not.toBe(beforeChat);
  });

  it('updateProvider: updates Chat instance when provider changes', () => {
    const chatFacade = new ChatFacade({
      id: 'chat-facade-id',
      messages: [],
      provider: createMockProvider({
        providerName: 'openai',
        textDeltaChunks: ['Hello', ' I am assistant.'],
        modelIds: ['gpt-4', 'gpt-5'],
      }),
      modelId: 'gpt-4',
    });

    expect(chatFacade.getProviderName()).toBe('openai');
    const beforeChat = chatFacade.__getChat();

    chatFacade.updateProvider(
      createMockProvider({
        providerName: 'opencode',
        textDeltaChunks: ['Hello', ' I am assistant.'],
        modelIds: ['gpt-4', 'gpt-5'],
      }),
      'gpt-5',
    );

    expect(chatFacade.getProviderName()).toBe('opencode');
    expect(chatFacade.__getChat()).not.toBe(beforeChat);
  });
});
