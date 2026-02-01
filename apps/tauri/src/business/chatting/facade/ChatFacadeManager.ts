import { type Observable, Subject } from 'rxjs';
import type { ChatFacade } from './ChatFacade';

/**
 * @singleton
 */
export class ChatFacadeManager {
  private static instance: ChatFacadeManager;
  private chatFacades: Map<string, ChatFacade> = new Map();
  private chatFacadeCreated$ = new Subject<string>();

  private constructor() {}

  public static getInstance() {
    if (!ChatFacadeManager.instance) {
      ChatFacadeManager.instance = new ChatFacadeManager();
    }
    return ChatFacadeManager.instance;
  }

  public hasChatFacade(id: string) {
    return this.chatFacades.has(id);
  }

  public getChatFacade(id: string) {
    const facade = this.chatFacades.get(id);
    if (!facade) {
      throw new Error(
        `ChatFacadeManager: chat facade with id ${id} is not found.`,
      );
    }

    return facade;
  }

  public setChatFacade(id: string, chatFacade: ChatFacade) {
    const prevFacade = this.hasChatFacade(id) ? this.getChatFacade(id) : null;

    if (prevFacade && prevFacade !== chatFacade) {
      prevFacade.dispose();
    }

    this.chatFacades.set(id, chatFacade);
    this.chatFacadeCreated$.next(id);
  }

  public getChatFacadeCreated$(): Observable<string> {
    return this.chatFacadeCreated$.asObservable();
  }

  public deleteChatFacadeById(id: string) {
    const chatFacade = this.getChatFacade(id);
    if (chatFacade) {
      chatFacade.dispose();
    }
    this.chatFacades.delete(id);
  }
}
