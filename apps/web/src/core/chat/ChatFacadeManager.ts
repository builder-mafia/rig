import type { ChatFacade } from './ChatFacade';

/**
 * @singleton
 */
export class ChatFacadeManager {
  private static instance: ChatFacadeManager;
  private chatFacades: Map<string, ChatFacade> = new Map();

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
    return this.chatFacades.get(id);
  }

  public setChatFacade(id: string, chatFacade: ChatFacade) {
    const oldChatFacade = this.getChatFacade(id);

    if (oldChatFacade && oldChatFacade !== chatFacade) {
      oldChatFacade.dispose();
    }

    this.chatFacades.set(id, chatFacade);
  }
}
