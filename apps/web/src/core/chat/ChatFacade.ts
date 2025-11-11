import { Chat } from '@ai-sdk/react';
import type { ChatInit, ChatStatus, UIMessage } from 'ai';
import { BehaviorSubject } from 'rxjs';
import { UIMessageStore } from '../UiMessageStore';
import type { AiService, AiServiceModelMap } from './ai-model';
import { createTransport } from './createTransport';

type CreateChatOptions = Pick<
  ChatInit<UIMessage>,
  'id' | 'onData' | 'onFinish' | 'onError' | 'messages'
>;

export const createChatFacade = <S extends AiService>(
  apiKey: string,
  service: S,
  model: AiServiceModelMap[S],
  { id, messages, onData, onFinish, onError }: Required<CreateChatOptions>,
) => {
  const transport = createTransport(apiKey, service, model);
  const chat = new Chat({
    id,
    onData,
    onFinish,
    onError,
    transport,
    messages,
  });

  return new ChatFacade({
    chat,
  });
};

export class ChatFacade<UI_MESSAGE extends UIMessage> {
  private chat: Chat<UI_MESSAGE>;
  /**
   * @description Set messages to Display to the user.
   */
  private uiMessageStore: UIMessageStore<UI_MESSAGE>;
  private status$ = new BehaviorSubject<ChatStatus>('ready' as ChatStatus);

  constructor({
    chat,
  }: {
    chat: Chat<UI_MESSAGE>;
  }) {
    this.chat = chat;
    this.uiMessageStore = new UIMessageStore();

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
      // chat have onError callback.
      // we don't need to handle error here. (May change suddenly in the future.)
    });
  }

  public getChatTransport() {
    return this.chat;
  }

  public getContextMessageStore() {
    return {
      setContextMessage: (
        valueOrFn: UI_MESSAGE[] | ((prev: UI_MESSAGE[]) => UI_MESSAGE[]),
      ) => {
        if (typeof valueOrFn === 'function') {
          this.chat.messages = valueOrFn(this.chat.messages);
        } else {
          this.chat.messages = valueOrFn;
        }
      },
      getContextMessage: () => {
        return this.chat.messages;
      },
    };
  }

  public getUiMessageStore() {
    return this.uiMessageStore;
  }

  public getStatus$() {
    return this.status$;
  }
}
