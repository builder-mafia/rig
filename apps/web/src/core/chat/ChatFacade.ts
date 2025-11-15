import { Chat } from '@ai-sdk/react';
import type { ChatInit, ChatStatus, UIMessage } from 'ai';
import { BehaviorSubject, type Observable, take } from 'rxjs';
import { type Setter, setValueOrFn } from '@/utils/setter';
import { UIMessageStore } from '../UiMessageStore';
import type { LLMModelNameMap, LLMProvider } from './ai-model';
import { createTransport } from './createTransport';

type CreateChatOptions = Pick<
  ChatInit<UIMessage>,
  'id' | 'onData' | 'onFinish' | 'onError' | 'messages'
>;

const createChat = <S extends LLMProvider>(
  apiKey: string,
  provider: S,
  model: LLMModelNameMap[S],
  { id, messages, onData, onFinish, onError }: Required<CreateChatOptions>,
) => {
  const transport = createTransport(apiKey, provider, model);
  const chat = new Chat({
    id,
    onData,
    onFinish,
    onError,
    transport,
    messages,
  });
  return chat;
};

export const createChatFacade = <S extends LLMProvider>(
  apiKey: string,
  provider: S,
  model: LLMModelNameMap[S],
  { id, messages, onData, onFinish, onError }: Required<CreateChatOptions>,
) => {
  const chat = createChat(apiKey, provider, model, {
    id,
    messages,
    onData,
    onFinish,
    onError,
  });

  return new ChatFacade({
    chat,
    apiKey,
    provider,
    model,
  });
};

export class ChatFacade<UI_MESSAGE extends UIMessage> {
  private chat: Chat<UI_MESSAGE>;
  /**
   * @description Set messages to Display to the user.
   */
  private uiMessageStore: UIMessageStore<UI_MESSAGE>;
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
  private model: LLMModelNameMap[LLMProvider];
  private apiKey: string;

  constructor({
    chat,
    provider,
    apiKey,
    model,
  }: {
    chat: Chat<UI_MESSAGE>;
    provider: LLMProvider;
    apiKey: string;
    model: LLMModelNameMap[LLMProvider];
  }) {
    this.chat = chat;
    this.uiMessageStore = new UIMessageStore<UI_MESSAGE>();
    this.provider = provider;
    this.model = model;
    this.apiKey = apiKey;

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

  public getContextMessages(): UI_MESSAGE[] {
    return this.chat.messages;
  }

  public setContextMessages(setter: Setter<UI_MESSAGE[]>) {
    this.chat.messages = setValueOrFn(this.chat.messages, setter);
  }

  public getUiMessages(): UI_MESSAGE[] {
    return this.uiMessageStore.getUiMessages();
  }

  public getUiMessages$(): Observable<UI_MESSAGE[]> {
    return this.uiMessageStore.getUiMessages$();
  }

  public setUiMessages(setter: Setter<UI_MESSAGE[]>) {
    this.uiMessageStore.setUiMessages(setter);
  }

  public getStatus(): ChatStatus {
    return this.status$.getValue();
  }

  public getStatus$(): Observable<ChatStatus> {
    return this.status$.asObservable();
  }

  public sendMessage(message: UI_MESSAGE & { role: 'user' }) {
    this.chat.sendMessage(message);
  }

  public setLLMModel<S extends LLMProvider>(
    provider: S,
    model: LLMModelNameMap[S],
    apiKey: string,
  ) {
    this.provider = provider;
    this.model = model;
    this.apiKey = apiKey;

    const transport = createTransport(this.apiKey, this.provider, this.model);

    // if the chat is submitted or streaming, wait for the status to be change,
    // and then set the new transport.
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

  public stop() {
    if (this.chat.status === 'streaming' || this.chat.status === 'submitted') {
      this.chat.stop();
    }
  }
}
