import type { LanguageModelV3 } from '@ai-sdk/provider';
import { Chat } from '@ai-sdk/react';
import type { LLMProvider, ModelResponseOptions } from '@allin/chat';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import type {
  ChatOnDataCallback,
  ChatOnFinishCallback,
  ChatStatus,
  UIMessage,
} from 'ai';
import { BehaviorSubject, type Observable, Subject } from 'rxjs';
import type { Setter } from './setter';
import { UIMessageStore } from './UiMessageStore';

type ChatUiMessage = UIMessage<UIMessageMetadata>;

type CreateChatFacadeParams = {
  id: string;
  messages: ChatUiMessage[];
  provider: LLMProvider;
  responseOptions: ModelResponseOptions;
  modelId: string;
  throttleTime?: number;
};

export class ChatFacade {
  private id: string;
  private chat: Chat<ChatUiMessage>;
  /**
   * @description Set messages to Display to the user.
   */
  private uiMessageStore: UIMessageStore<ChatUiMessage>;
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

  private onData$ = new Subject<
    Parameters<ChatOnDataCallback<ChatUiMessage>>[0]
  >();
  private onFinish$ = new Subject<
    Parameters<ChatOnFinishCallback<ChatUiMessage>>[0]
  >();
  private onError$ = new Subject<Error>();
  private onBeforeSend$ = new Subject<ChatUiMessage & { role: 'user' }>();

  private provider: LLMProvider;
  private _isDisposed = false;
  private model: LanguageModelV3;
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
    this.uiMessageStore = new UIMessageStore<ChatUiMessage>();
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

  public getMessages(): ChatUiMessage[] {
    return this.chat.messages;
  }

  public getUiMessages(): ChatUiMessage[] {
    return this.uiMessageStore.getUiMessages();
  }

  public getUiMessages$(): Observable<ChatUiMessage[]> {
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

  /**
   * emit when chat is finished.
   */
  public get finish$() {
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

  public setUiMessages(setter: Setter<ChatUiMessage[]>) {
    this.uiMessageStore.setUiMessages(setter);
  }

  /**
   * replace the message in the context
   */
  public replaceMessage(message: ChatUiMessage) {
    const existingMessageIndex = this.getUiMessages().findIndex(
      m => m.id === message.id,
    );

    if (existingMessageIndex === -1) {
      throw new Error(
        `replaceMessage: target message not found: ${message.id}.`,
      );
    }

    const newMessages = [
      ...this.getUiMessages().slice(0, existingMessageIndex),
      message,
      ...this.getUiMessages().slice(existingMessageIndex + 1),
    ];

    this.setUiMessages(newMessages);
  }

  /**
   * create or replace the message in the context
   */
  public createOrReplaceMessage(message: ChatUiMessage) {
    const existingMessageIndex = this.getUiMessages().findIndex(
      m => m.id === message.id,
    );

    const newMessages =
      existingMessageIndex !== -1
        ? [
            ...this.getUiMessages().slice(0, existingMessageIndex),
            message,
            ...this.getUiMessages().slice(existingMessageIndex + 1),
          ]
        : [...this.getUiMessages(), message];

    this.setUiMessages(newMessages);
  }

  public addSystemMessage(message: ChatUiMessage & { role: 'system' }) {
    this.chat.messages = [...this.chat.messages, message];
  }

  /**
   * check if the message is in the context
   */
  public hasMessage(messageId: string) {
    return this.chat.messages.some(msg => msg.id === messageId);
  }

  public async sendMessage(message: ChatUiMessage & { role: 'user' }) {
    if (this._isDisposed) {
      throw new Error('ChatFacade is disposed');
    }

    this.onBeforeSend$.next(message);
    await this.chat.sendMessage(message);
    // return response message
    return this.chat.lastMessage;
  }

  public async regenerateMessage(messageId: string) {
    if (this._isDisposed) {
      throw new Error('ChatFacade is disposed');
    }

    this.setUiMessages(prev => prev.filter(msg => msg.id !== messageId));
    await this.chat.regenerate({
      messageId,
    });
    return this.chat.lastMessage;
  }

  public async stop() {
    if (this._isDisposed) {
      throw new Error('ChatFacade is disposed');
    }

    if (this.chat.status === 'streaming' || this.chat.status === 'submitted') {
      await this.chat.stop();
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
    messages: ChatUiMessage[];
    provider: LLMProvider;
    model: LanguageModelV3;
    responseOptions: ModelResponseOptions;
    throttleTime: number;
  }) {
    const transport = provider.createTextStream(model, responseOptions);

    const chat = new Chat<ChatUiMessage>({
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
        this.createOrReplaceMessage(streamingMessage);
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
