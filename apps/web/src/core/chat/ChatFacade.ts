import type { Chat } from '@ai-sdk/react';
import type { ChatStatus, UIMessage } from 'ai';
import { BehaviorSubject, type Observable, take } from 'rxjs';
import { type Setter, setValueOrFn } from '@/utils/setter';
import { UIMessageStore } from '../UiMessageStore';
import type { LLMModel, LLMModelMap, LLMProvider } from './ai-model';
import { ChatFacadeManager } from './ChatFacadeManager';
import { type CreateChatOptions, createChat } from './createChat';
import type { CustomTransport } from './createTransport';

export const createChatFacade = ({
  id,
  messages,
  onData,
  onFinish,
  onError,
  transport,
}: Required<CreateChatOptions>) => {
  const chat = createChat({
    transport,
    id,
    messages,
    onData,
    onFinish,
    onError,
  });

  return new ChatFacade({
    chat,
    provider: transport.metadata.provider,
    model: transport.metadata.model,
  });
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
  private model: LLMModelMap[LLMProvider];

  constructor({
    chat,
    provider,
    model,
  }: {
    chat: Chat<UIMessage>;
    provider: LLMProvider;
    model: LLMModelMap[LLMProvider];
  }) {
    ChatFacadeManager.setChatFacade(chat.id, this);

    this.chat = chat;
    this.uiMessageStore = new UIMessageStore<UIMessage>();
    this.provider = provider;
    this.model = model;

    this.chat['~registerStatusCallback'](() => {
      this.status$.next(this.chat.status);
    });

    this.chat['~registerMessagesCallback'](() => {
      if (this.chat.lastMessage) {
        const msg = this.chat.lastMessage;
        this.uiMessageStore.setUiMessages(prev => {
          if (prev.at(-1)?.id === msg.id) {
            return [...prev.slice(0, -1), msg];
          } else {
            return [...prev, msg];
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
   * getLLM() => { provider: 'openai', model: 'gpt-4.1' }
   * getLLM() => { provider: 'google', model: 'gemini-2.5-flash' }
   */
  public getLLM(): { provider: LLMProvider; model: LLMModel } {
    return {
      provider: this.provider,
      model: this.model,
    };
  }

  public stop() {
    if (this.chat.status === 'streaming' || this.chat.status === 'submitted') {
      this.chat.stop();
    }
  }

  public setTransport(transport: CustomTransport) {
    this.provider = transport.metadata.provider;
    this.model = transport.metadata.model;
    // if the chat is submitted or streaming, wait for the chat to be finished,
    if (this.chat.status === 'submitted' || this.chat.status === 'streaming') {
      this.getStatus$()
        .pipe(take(1))
        .subscribe(() => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error : this is a private property of the chat object
          this.chat.transport = transport;
        });
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error : this is a private property of the chat object
      this.chat.transport = transport;
    }
  }
}
