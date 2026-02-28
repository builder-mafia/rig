import { Chat } from '@ai-sdk/react';
import type { ProviderId } from '@allin/ai';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import { StateSubject } from '@allin/utils';
import type {
  ChatOnDataCallback,
  ChatOnFinishCallback,
  ChatStatus,
  ChatTransport,
  UIMessage,
} from 'ai';
import { throttle } from 'es-toolkit';
import { type Observable, Subject } from 'rxjs';
import type { TauriChatTransport } from '../transport/TauriChatTransport';
import type { Setter } from './setter';
import { UIMessageStore } from './UiMessageStore';

type ChatUiMessage = UIMessage<UIMessageMetadata>;

type CreateChatFacadeParams = {
  id: string;
  messages: ChatUiMessage[];
  transport: TauriChatTransport;
  throttleTime?: number;
};

export const DEFAULT_THROTTLE_TIME = 50;

export class ChatFacade {
  private id: string;
  private chat: Chat<ChatUiMessage>;
  private uiMessageStore: UIMessageStore<ChatUiMessage>;
  private status$ = new StateSubject<ChatStatus>('ready');
  private onData$ = new Subject<
    Parameters<ChatOnDataCallback<ChatUiMessage>>[0]
  >();
  private onFinish$ = new Subject<
    Omit<Parameters<ChatOnFinishCallback<ChatUiMessage>>[0], 'messages'>
  >();
  private onError$ = new Subject<Error>();
  private onBeforeSend$ = new Subject<ChatUiMessage & { role: 'user' }>();
  private _isDisposed = false;
  private throttleTime: number;
  public modelId: string;
  public providerId: ProviderId;

  constructor({
    id,
    transport,
    messages,
    throttleTime = DEFAULT_THROTTLE_TIME,
  }: CreateChatFacadeParams) {
    this.uiMessageStore = new UIMessageStore<ChatUiMessage>();
    this.id = id;
    this.throttleTime = throttleTime;
    this.providerId = transport.getProviderName();
    this.modelId = transport.getModelId();

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

  public getOnData$() {
    return this.onData$.asObservable();
  }

  public get finish$() {
    return this.onFinish$.asObservable();
  }

  public getOnError$() {
    return this.onError$.asObservable();
  }

  public beforeMessageSend$() {
    return this.onBeforeSend$.asObservable();
  }

  private setUiMessages(setter: Setter<ChatUiMessage[]>) {
    this.uiMessageStore.setUiMessages(setter);
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
      onFinish: ({ message, isAbort, isDisconnect, isError }) => {
        const metadata: UIMessageMetadata = {
          ...(message.metadata ?? {}),
          provider: this.providerId,
          modelId: this.modelId,
          isAborted: isAbort || undefined,
          isDisconnected: isDisconnect || undefined,
          isError: isError || undefined,
          errorMessage: JSON.stringify(
            this.chat.error?.message ?? this.chat.error,
          ),
        };

        const messageWithMetadata: ChatUiMessage = {
          ...message,
          metadata,
        };

        const throttledSetUiMessages = throttle(
          () => {
            if (
              this.uiMessageStore.getUiMessages().some(m => m.id === message.id)
            ) {
              this.setUiMessages(prev =>
                prev.map(m => {
                  if (m.id === message.id) {
                    return messageWithMetadata;
                  }
                  return m;
                }),
              );
            } else {
              this.setUiMessages(prev => [...prev, messageWithMetadata]);
            }

            this.onFinish$.next({
              message: messageWithMetadata,
              isAbort,
              isDisconnect,
              isError,
            });
          },
          this.throttleTime * 1.2,
          {
            edges: ['trailing'],
          },
        );

        throttledSetUiMessages();
      },
      onError: error => {
        this.onError$.next(error);
      },
    });

    chat['~registerStatusCallback'](() => {
      this.status$.next(chat.status);
    });

    chat['~registerMessagesCallback'](() => {
      this.setUiMessages(chat.messages);
    }, throttleTime);

    this.chat = chat;

    return chat;
  }

  public updateTransport(transport: TauriChatTransport) {
    this.providerId = transport.getProviderName();
    this.modelId = transport.getModelId();
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
