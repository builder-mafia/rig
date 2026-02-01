import { Chat } from '@ai-sdk/react';
import type { LLMProviderName } from '@allin/ai';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import type {
  ChatOnDataCallback,
  ChatOnFinishCallback,
  ChatStatus,
  ChatTransport,
  UIMessage,
} from 'ai';
import { BehaviorSubject, type Observable, Subject } from 'rxjs';
import type { Setter } from './setter';
import { UIMessageStore } from './UiMessageStore';

type ChatUiMessage = UIMessage<UIMessageMetadata>;

type CreateChatFacadeParams = {
  id: string;
  messages: ChatUiMessage[];
  transport: ChatTransport<ChatUiMessage>;
  providerName: LLMProviderName;
  modelId: string;
  throttleTime?: number;
};

export class ChatFacade {
  private id: string;
  private chat: Chat<ChatUiMessage>;
  private uiMessageStore: UIMessageStore<ChatUiMessage>;
  private status$ = new BehaviorSubject<ChatStatus>('ready');

  private onData$ = new Subject<
    Parameters<ChatOnDataCallback<ChatUiMessage>>[0]
  >();
  private onFinish$ = new Subject<
    Parameters<ChatOnFinishCallback<ChatUiMessage>>[0]
  >();
  private onError$ = new Subject<Error>();
  private onBeforeSend$ = new Subject<ChatUiMessage & { role: 'user' }>();

  private providerName: LLMProviderName;
  private modelId: string;
  private _isDisposed = false;
  private throttleTime: number;

  constructor({
    id,
    transport,
    providerName,
    modelId,
    messages,
    throttleTime = 50,
  }: CreateChatFacadeParams) {
    this.uiMessageStore = new UIMessageStore<ChatUiMessage>();
    this.id = id;
    this.providerName = providerName;
    this.modelId = modelId;
    this.throttleTime = throttleTime;

    this.chat = this.createChat({
      id,
      messages,
      transport,
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
    return this.modelId;
  }

  public getOnData$() {
    return this.onData$.asObservable();
  }

  public get finish$() {
    return this.onFinish$.asObservable();
  }

  public getOnError$() {
    return this.onError$.asObservable();
  }

  public getOnBeforeSend$() {
    return this.onBeforeSend$.asObservable();
  }

  public __getChat() {
    return this.chat;
  }

  public getProviderName() {
    return this.providerName;
  }

  public setUiMessages(setter: Setter<ChatUiMessage[]>) {
    this.uiMessageStore.setUiMessages(setter);
  }

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

  public async sendMessage(message: ChatUiMessage & { role: 'user' }) {
    if (this._isDisposed) {
      throw new Error('ChatFacade is disposed');
    }

    this.onBeforeSend$.next(message);
    await this.chat.sendMessage(message);
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

  private createChat({
    id,
    messages,
    transport,
    throttleTime,
  }: {
    id: string;
    messages: ChatUiMessage[];
    transport: ChatTransport<ChatUiMessage>;
    throttleTime: number;
  }) {
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

  public updateTransport(
    transport: ChatTransport<ChatUiMessage>,
    providerName: LLMProviderName,
    modelId: string,
  ) {
    this.providerName = providerName;
    this.modelId = modelId;

    this.createChat({
      id: this.chat.id,
      messages: this.chat.messages,
      transport,
      throttleTime: this.throttleTime,
    });
  }

  public dispose() {
    this._isDisposed = true;
  }
}
