import { Chat } from '@ai-sdk/react';
import type { ProviderId } from '@allin/ai';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import { type Setter, StateSubject, setValueOrFn } from '@allin/utils';
import type {
  ChatOnDataCallback,
  ChatOnFinishCallback,
  ChatStatus,
  ChatTransport,
  UIMessage,
} from 'ai';
import { type Observable, Subject } from 'rxjs';

type ChatUiMessage = UIMessage<UIMessageMetadata>;

type SessionParam = {
  id: string;
  messages: ChatUiMessage[];
  transport: ChatTransport<ChatUiMessage>;
  providerName: ProviderId;
  modelId: string;
  throttleTime?: number;
};

export class Session {
  private id: string;
  private chat: Chat<ChatUiMessage>;
  private uiMessageStore = new StateSubject<ChatUiMessage[]>([]);
  private status$ = new StateSubject<ChatStatus>('ready');

  private onData$ = new Subject<
    Parameters<ChatOnDataCallback<ChatUiMessage>>[0]
  >();
  private onFinish$ = new Subject<
    Parameters<ChatOnFinishCallback<ChatUiMessage>>[0]
  >();
  private onError$ = new Subject<Error>();
  private onBeforeSend$ = new Subject<ChatUiMessage & { role: 'user' }>();

  private providerName: ProviderId;
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
  }: SessionParam) {
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

    this.uiMessageStore.next(this.chat.messages);
  }

  public getId(): string {
    return this.id;
  }

  public getMessages(): ChatUiMessage[] {
    return this.chat.messages;
  }

  public getUiMessages(): ChatUiMessage[] {
    return this.uiMessageStore.getValue();
  }

  public getUiMessages$(): Observable<ChatUiMessage[]> {
    return this.uiMessageStore.asObservable();
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
    this.uiMessageStore.next(
      setValueOrFn(this.uiMessageStore.getValue(), setter),
    );
  }

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

  public hasMessage(messageId: string) {
    return this.chat.messages.some(msg => msg.id === messageId);
  }

  public async sendMessage(message: ChatUiMessage & { role: 'user' }) {
    if (this._isDisposed) {
      throw new Error('ChatFacade is disposed');
    }

    this.onBeforeSend$.next(message);
    await this.chat.sendMessage(message);
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
    providerName: ProviderId,
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
