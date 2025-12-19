import type { LanguageModelV2 } from '@ai-sdk/provider';
import { Chat } from '@ai-sdk/react';
import type {
  ChatOnDataCallback,
  ChatOnFinishCallback,
  ChatStatus,
  UIMessage,
} from 'ai';
import { BehaviorSubject, type Observable, Subject } from 'rxjs';
import type {
  LLMProvider,
  ModelResponseOptions,
} from '../provider/LLMProvider';
import type { Setter } from '../utils/setter';
import { UIMessageStore } from './UiMessageStore';

type CreateChatFacadeParams = {
  id: string;
  messages: UIMessage[];
  provider: LLMProvider;
  responseOptions: ModelResponseOptions;
  modelId: string;
  throttleTime?: number;
};

export class ChatFacade {
  private id: string;
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

  private onData$ = new Subject<Parameters<ChatOnDataCallback<UIMessage>>[0]>();
  private onFinish$ = new Subject<
    Parameters<ChatOnFinishCallback<UIMessage>>[0]
  >();
  private onError$ = new Subject<Error>();
  private onBeforeSend$ = new Subject<UIMessage & { role: 'user' }>();

  private provider: LLMProvider;
  private _isDisposed = false;
  private model: LanguageModelV2;
  private responseOptions: ModelResponseOptions;
  private throttleTime: number;

  constructor({
    id,
    provider,
    modelId,
    responseOptions,
    messages,
    throttleTime = 50,
  }: CreateChatFacadeParams) {
    this.uiMessageStore = new UIMessageStore<UIMessage>();
    this.id = id;
    this.provider = provider;
    this.responseOptions = responseOptions;
    this.model = provider.getModel(modelId);
    this.throttleTime = throttleTime;

    this.chat = this.updateChat({
      id,
      messages,
      provider,
      responseOptions: this.responseOptions,
      model: this.model,
      throttleTime,
    });

    this.uiMessageStore.setUiMessages(this.chat.messages);
  }

  public getId(): string {
    return this.id;
  }

  public getMessages(): UIMessage[] {
    return this.chat.messages;
  }

  public getUiMessages(): UIMessage[] {
    return this.uiMessageStore.getUiMessages();
  }

  public getUiMessages$(): Observable<UIMessage[]> {
    return this.uiMessageStore.getUiMessages$();
  }

  public getStatus(): ChatStatus {
    return this.status$.getValue();
  }

  public getStatus$(): Observable<ChatStatus> {
    return this.status$.asObservable();
  }

  public getError() {
    return this.chat.error;
  }

  public getModelId() {
    return this.model.modelId;
  }

  public getOnData$() {
    return this.onData$.asObservable();
  }

  public getOnFinish$() {
    return this.onFinish$.asObservable();
  }

  public getOnError$() {
    return this.onError$.asObservable();
  }

  public getOnBeforeSend$() {
    return this.onBeforeSend$.asObservable();
  }

  /**
   * this must be used for testing only.
   */
  public __getChat() {
    return this.chat;
  }

  /**
   * @example return 'openai'
   */
  public getProviderName() {
    return this.provider.name;
  }

  public setUiMessages(setter: Setter<UIMessage[]>) {
    this.uiMessageStore.setUiMessages(setter);
  }

  public addSystemMessage(message: UIMessage & { role: 'system' }) {
    this.chat.messages = [...this.chat.messages, message];
  }

  public async sendMessage(message: UIMessage & { role: 'user' }) {
    if (this._isDisposed) {
      throw new Error('ChatFacade is disposed');
    }

    this.onBeforeSend$.next(message);
    await this.chat.sendMessage(message);
    // return response message
    return this.chat.lastMessage;
  }

  public stop() {
    if (this._isDisposed) {
      throw new Error('ChatFacade is disposed');
    }

    if (this.chat.status === 'streaming' || this.chat.status === 'submitted') {
      this.chat.stop();
    }
  }

  private updateChat({
    id,
    messages,
    provider,
    model,
    responseOptions,
    throttleTime,
  }: {
    id: string;
    messages: UIMessage[];
    provider: LLMProvider;
    model: LanguageModelV2;
    responseOptions: ModelResponseOptions;
    throttleTime: number;
  }) {
    const transport = provider.createTransport(model, responseOptions);

    const chat = new Chat({
      id,
      transport,
      messages,
      onData: data => {
        this.onData$.next(data);
      },
      onFinish: options => {
        this.onFinish$.next(options);
      },
      onError: error => {
        this.onError$.next(error);
      },
    });

    chat['~registerStatusCallback'](() => {
      this.status$.next(chat.status);
    });

    chat['~registerMessagesCallback'](() => {
      const streamingMessage = chat.lastMessage;

      if (streamingMessage) {
        this.uiMessageStore.setUiMessages(prev => {
          if (prev.at(-1)?.id === streamingMessage.id) {
            return [...prev.slice(0, -1), streamingMessage];
          } else {
            return [...prev, streamingMessage];
          }
        });
      }
    }, throttleTime);

    this.chat = chat;

    return chat;
  }

  public updateModelId(modelId: string) {
    const newModel = this.provider.getModel(modelId);
    this.model = newModel;

    this.updateChat({
      id: this.chat.id,
      messages: this.chat.messages,
      provider: this.provider,
      model: this.model,
      responseOptions: this.responseOptions,
      throttleTime: this.throttleTime,
    });
  }

  /**
   * In most cases, when the provider changes, the modelId should change accordingly.
   *
   * For example:
   * - When switching from google to openai, the modelId should change from gemini to gpt.
   */
  public updateProvider(provider: LLMProvider, modelId: string) {
    this.provider = provider;
    this.model = this.provider.getModel(modelId);

    this.updateChat({
      id: this.chat.id,
      messages: this.chat.messages,
      provider: this.provider,
      model: this.model,
      responseOptions: this.responseOptions,
      throttleTime: this.throttleTime,
    });
  }

  public updateModelResponseOptions(options: ModelResponseOptions) {
    this.responseOptions = options;

    this.updateChat({
      id: this.chat.id,
      messages: this.chat.messages,
      provider: this.provider,
      model: this.model,
      responseOptions: this.responseOptions,
      throttleTime: this.throttleTime,
    });
  }

  public dispose() {
    this._isDisposed = true;
  }
}
