import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { ChatInit, UIMessage } from 'ai';
import { noop } from 'es-toolkit';
import { useCallback, useRef, useSyncExternalStore } from 'react';
import { generateUIMessage } from '../helper';
import type { LLMProvider } from '../provider/LLMProvider';
import { type ChatFacade, createChatFacade } from './ChatFacade';
import { ChatFacadeManager } from './ChatFacadeManager';

/**
 * It must be declared as a constant to avoid infinite re-rendering.
 */
const EMPTY_MESSAGES: UIMessage[] = [];

type UseChatOptions = {
  /**
   * this is unique id of the chat.
   * It should be channelId.
   */
  id: string;
  provider: LLMProvider;
  /**
   * @example 'gpt-5.1'
   */
  modelId?: string;
  model?: LanguageModelV2;
  messages: UIMessage[];
  onBeforeSend?: (message: UIMessage) => void;
  onFinish?: ChatInit<UIMessage>['onFinish'];
  onError?: ChatInit<UIMessage>['onError'];
  onData?: ChatInit<UIMessage>['onData'];
};

/**
 * if chatFacade is changed, the uiMessages and status will be updated.
 */
export const useChat = <UI_MESSAGE extends UIMessage>({
  id,
  provider,
  model,
  modelId,
  messages,
  onBeforeSend,
  ...chatCallbacks
}: UseChatOptions) => {
  if (!model && !modelId) {
    throw new Error('useChat: model or modelId is required');
  }
  if (model && modelId) {
    throw new Error('useChat: both model and modelId cannot be used together');
  }

  const chatFacadeRef = useRef<ChatFacade>(
    ChatFacadeManager.getChatFacade(id) ??
      createChatFacade({
        id,
        messages,
        provider,
        model,
        modelId,
        onBeforeSend,
        onData: chatCallbacks.onData ?? noop,
        onFinish: chatCallbacks.onFinish ?? noop,
        onError: chatCallbacks.onError ?? noop,
      }),
  );

  const shouldRecreateChatFacade = chatFacadeRef.current?.getId() !== id;

  if (shouldRecreateChatFacade) {
    chatFacadeRef.current = createChatFacade({
      id,
      messages,
      provider,
      model,
      modelId,
      onBeforeSend,
      onData: chatCallbacks.onData ?? noop,
      onFinish: chatCallbacks.onFinish ?? noop,
      onError: chatCallbacks.onError ?? noop,
    });
  }

  const shouldUpdateTransport =
    // if 'google' => 'openai'
    provider.name !== chatFacadeRef.current.getProviderName() ||
    // or 'gpt-5.1' => 'gpt-4.1'
    (modelId && modelId !== chatFacadeRef.current.getModelId()) ||
    // or new model instance
    (model && !chatFacadeRef.current.isSameModel(model));

  if (shouldUpdateTransport) {
    chatFacadeRef.current.setProvider(provider);
    chatFacadeRef.current.setModel(
      model ? model : provider.createModel(modelId!),
    );
    chatFacadeRef.current.updateTransport();
  }

  const subscribeToMessages = (onChange: () => void) => {
    const subscription = chatFacadeRef.current
      .getUiMessages$()
      .subscribe(onChange);
    return () => {
      subscription.unsubscribe();
    };
  };

  const uiMessages = useSyncExternalStore(
    subscribeToMessages,
    () => chatFacadeRef.current.getUiMessages() ?? EMPTY_MESSAGES,
    () => chatFacadeRef.current.getUiMessages() ?? EMPTY_MESSAGES,
  );

  const subscribeToStatus = (onChange: () => void) => {
    const subscription = chatFacadeRef.current.getStatus$().subscribe(onChange);
    return () => {
      subscription.unsubscribe();
    };
  };

  const status = useSyncExternalStore(
    subscribeToStatus,
    () => chatFacadeRef.current.getStatus() ?? 'error',
    () => chatFacadeRef.current.getStatus() ?? 'error',
  );

  const stop = () => {
    chatFacadeRef.current.stop();
  };

  const sendMessage = (message: UI_MESSAGE & { role: 'user' }) => {
    return chatFacadeRef.current.sendMessage(message);
  };

  const addPrompt = useCallback((prompt: string) => {
    const promptMessage = generateUIMessage('system', prompt);
    chatFacadeRef.current.setContextMessages(prev => [...prev, promptMessage]);
  }, []);

  return {
    uiMessages,
    status,
    stop,
    sendMessage,
    addPrompt,
  };
};
