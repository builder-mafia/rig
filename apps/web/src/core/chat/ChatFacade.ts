import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { Chat } from '@ai-sdk/react';
import type { ChatInit, ChatStatus, UIMessage } from 'ai';
import { isEqual } from 'es-toolkit';
import { BehaviorSubject, type Observable, take } from 'rxjs';
import { type Setter, setValueOrFn } from '@/utils/setter';
import type { LLMProvider } from '../provider/LLMProvider';
import { UIMessageStore } from '../UiMessageStore';
import { ChatFacadeManager } from './ChatFacadeManager';
import { createChat } from './createChat';

export type CreateChatFacadeOptions = {
  id: string;
  messages: UIMessage[];
  provider: LLMProvider;
  model?: LanguageModelV2;
  /**
   * @example 'gpt-5.1'
   */
  modelId?: string;
  onBeforeSend?: (message: UIMessage) => void;
  onData: Required<ChatInit<UIMessage>>['onData'];
  onFinish: Required<ChatInit<UIMessage>>['onFinish'];
  onError: Required<ChatInit<UIMessage>>['onError'];
};

export const createChatFacade = ({
  id,
  messages,
  provider,
  model,
  modelId,
  onBeforeSend,
  onData,
  onFinish,
  onError,
}: CreateChatFacadeOptions) => {
  const _model = model ?? provider.getModel(modelId!);
  const transport = provider.createTransport(_model);

  const chat = createChat({
    transport,
    id,
    messages,
    onData,
    onFinish,
    onError,
  });

  const chatFacade = new ChatFacade({
    chat,
    provider,
    model: _model,
    onBeforeSend,
  });

  ChatFacadeManager.setChatFacade(id, chatFacade);

  return chatFacade;
};

type CreateChatFacadeParams = {
  chat: Chat<UIMessage>;
  provider: LLMProvider;
  model: LanguageModelV2;
  onBeforeSend?: (message: UIMessage) => void;
};

export class ChatFacade {
  private chat: Chat<UIMessage>;
  /**
   * @description Set messages to Display to the user.
   */
  private uiMessageStore: UIMessageStore<UIMessage>;
  /**
   * status of the chat.
   * see: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot#status
   * - 'ready'
   * - 'streaming'
   * - 'submitted'
   * - 'error'
   */
  private status$ = new BehaviorSubject<ChatStatus>('ready');
  /**
   * current LLM provider and model
   */
  private provider: LLMProvider;
  private model: LanguageModelV2;
  private onBeforeSend?: (message: UIMessage) => void;
  private _isDisposed = false;

  constructor({ chat, provider, model, onBeforeSend }: CreateChatFacadeParams) {
    this.chat = chat;
    this.uiMessageStore = new UIMessageStore<UIMessage>();
    this.provider = provider;
    this.model = model;
    this.onBeforeSend = onBeforeSend;

    this.uiMessageStore.setUiMessages(chat.messages);

    this.chat['~registerStatusCallback'](() => {
      this.status$.next(this.chat.status);
    });

    this.chat['~registerMessagesCallback'](() => {
      if (this.chat.lastMessage) {
        const lastMessage = this.chat.lastMessage;
        this.uiMessageStore.setUiMessages(prev => {
          if (prev.at(-1)?.id === lastMessage.id) {
            return [...prev.slice(0, -1), lastMessage];
          } else {
            return [...prev, lastMessage];
          }
        });
      }
    }, 50);

    this.chat['~registerErrorCallback'](() => {
      //
    });
  }

  public getId(): string {
    return this.chat.id;
  }

  public getContextMessages(): UIMessage[] {
    return this.chat.messages;
  }

  public setContextMessages(setter: Setter<UIMessage[]>) {
    this.chat.messages = setValueOrFn(this.chat.messages, setter);
  }

  public getUiMessages(): UIMessage[] {
    return this.uiMessageStore.getUiMessages();
  }

  public getUiMessages$(): Observable<UIMessage[]> {
    return this.uiMessageStore.getUiMessages$();
  }

  public setUiMessages(setter: Setter<UIMessage[]>) {
    this.uiMessageStore.setUiMessages(setter);
  }

  public getStatus(): ChatStatus {
    return this.status$.getValue();
  }

  public getStatus$(): Observable<ChatStatus> {
    return this.status$.asObservable();
  }

  public sendMessage(message: UIMessage & { role: 'user' }) {
    if (this._isDisposed) {
      throw new Error('ChatFacade is disposed');
    }

    this.onBeforeSend?.(message);
    this.chat.sendMessage(message);
  }

  /**
   * @description Return the error of the chat when it is in error status.
   *
   * @example
   * getError() => Error | undefined
   */
  public getError() {
    return this.chat.error;
  }

  /**
   * @example
   * getLLM() => { provider: 'openai-', model: 'gpt-4.1' }
   * getLLM() => { provider: 'google', model: 'gemini-2.5-flash' }
   */
  public getProviderName() {
    return this.provider.name;
  }

  public getModelId() {
    return this.model.modelId;
  }

  public isSameModel(model: LanguageModelV2) {
    return isEqual(this.model, model);
  }

  public stop() {
    if (this._isDisposed) {
      throw new Error('ChatFacade is disposed');
    }

    if (this.chat.status === 'streaming' || this.chat.status === 'submitted') {
      this.chat.stop();
    }
  }

  public setProvider(provider: LLMProvider) {
    this.provider = provider;
  }

  public setModel(model: LanguageModelV2) {
    this.model = model;
  }

  public updateTransport() {
    if (this._isDisposed) {
      throw new Error('ChatFacade is disposed');
    }

    const newTransport = this.provider.createTransport(this.model);

    // if the chat is submitted or streaming, wait for the chat to be finished,
    if (this.chat.status === 'submitted' || this.chat.status === 'streaming') {
      this.getStatus$()
        .pipe(take(1))
        .subscribe(() => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error : this is a private property of the chat object
          this.chat.transport = newTransport;
        });
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error : this is a private property of the chat object
      this.chat.transport = newTransport;
    }
  }

  public dispose() {
    this._isDisposed = true;
  }
}
