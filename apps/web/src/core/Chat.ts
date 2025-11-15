import type { UIMessage } from 'ai';
import { v4 } from 'uuid';
import type { ChatService } from './ChatService';
import type { ChatSummarizer } from './ChatSummarizer';
import type { UIMessageStore } from './UiMessageStore';

export class Chat<UI_MESSAGE extends UIMessage> {
  private id: string;
  private chatService: ChatService<UI_MESSAGE>;
  private summarizer: ChatSummarizer;
  private uiMessageStore: UIMessageStore<UI_MESSAGE>;

  constructor({
    id = v4(),
    chatService,
    summarizer,
    uiMessageStore,
  }: {
    id: string;
    chatService: ChatService<UI_MESSAGE>;
    summarizer: ChatSummarizer;
    uiMessageStore: UIMessageStore<UI_MESSAGE>;
  }) {
    this.id = id;
    this.chatService = chatService;
    this.summarizer = summarizer;
    this.uiMessageStore = uiMessageStore;

    this.initSubscribe();
  }

  private initSubscribe() {
    this.chatService.data$.subscribe(data => {
      if (data) {
        this.uiMessageStore.setUiMessages(prev => {
          if (prev.at(-1)?.id === data.id) {
            return [...prev.slice(0, -1), data];
          } else {
            return [...prev, data];
          }
        });
      }
    });
  }

  public async sendMessage(message: UI_MESSAGE & { role: 'user' }) {
    this.uiMessageStore.setUiMessages(prev => [...prev, message]);
    return this.chatService.sendMessage(message);
  }

  public getUiMessages$() {
    return this.uiMessageStore.getUiMessages$();
  }

  public getUiMessages() {
    return this.uiMessageStore.getUiMessages();
  }

  public summarize(messages: UI_MESSAGE[]) {
    return this.summarizer.doSumerize(messages);
  }

  public getContextMessages() {
    return this.chatService.getMessages();
  }

  public setContextMessages(
    messages: UI_MESSAGE[] | ((prev: UI_MESSAGE[]) => UI_MESSAGE[]),
  ) {
    this.chatService.setMessages(messages);
  }

  public setUiMessages(
    messages: UI_MESSAGE[] | ((prev: UI_MESSAGE[]) => UI_MESSAGE[]),
  ) {
    this.uiMessageStore.setUiMessages(messages);
  }

  public getStatus() {
    return this.chatService.status$.getValue();
  }

  public subscribeMessages(listener: () => void) {
    const subscription = this.getUiMessages$().subscribe(listener);
    return () => {
      subscription.unsubscribe();
    };
  }

  public subscribeStatus(listener: () => void) {
    const subscription = this.getStatus$().subscribe(listener);

    return () => {
      subscription.unsubscribe();
    };
  }

  public getStatus$() {
    return this.chatService.status$.asObservable();
  }

  public async stop() {
    await this.chatService.stop();
  }
}
