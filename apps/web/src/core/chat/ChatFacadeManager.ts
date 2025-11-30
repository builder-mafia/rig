import type { UIMessage } from 'ai';
import type { ChatFacade } from './ChatFacade';

/**
 * channel and chat facade is 1:1 mapping.
 *
 * id is channelId.
 */
export class ChatFacadeManager {
  private static instance: ChatFacadeManager;
  private static chatFacades: Map<string, ChatFacade> = new Map();

  private constructor() {}

  public static getInstance() {
    if (!ChatFacadeManager.instance) {
      ChatFacadeManager.instance = new ChatFacadeManager();
    }
    return ChatFacadeManager.instance;
  }

  public static hasChatFacade(id: string) {
    return ChatFacadeManager.chatFacades.has(id);
  }

  public static getChatFacade(id: string) {
    return ChatFacadeManager.chatFacades.get(id);
  }

  public static setChatFacade(id: string, chatFacade: ChatFacade) {
    ChatFacadeManager.chatFacades.set(id, chatFacade);
  }

  public static disposeChatFacade(id: string) {
    ChatFacadeManager.chatFacades.delete(id);
  }
}
