import type { ProviderId } from '@allin/ai';
import { type Observable, Subject } from 'rxjs';
import { AgentManager } from '@/business/agent/AgentManager';
import type { StorageAgent } from '@/lib/gateway/agent/types';
import type { StorageChannel } from '@/lib/gateway/channel/types';
import { messageGateway } from '@/lib/gateway/message/messageGateway';
import { TauriChatTransport } from '../transport/TauriChatTransport';
import { ChatFacade } from './ChatFacade';

/**
 * @singleton
 */
export class ChatFacadeManager {
  private static instance: ChatFacadeManager;
  private chatFacades: Map<string, ChatFacade> = new Map();
  private chatFacadeCreated$ = new Subject<string>();

  private agentManager: AgentManager;

  private constructor(agentManager: AgentManager) {
    this.agentManager = agentManager;
  }

  public static getInstance() {
    if (!ChatFacadeManager.instance) {
      ChatFacadeManager.instance = new ChatFacadeManager(
        AgentManager.getInstance(),
      );
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

  public async getOrCreate(channel: StorageChannel): Promise<ChatFacade> {
    const id = channel.id;
    if (this.hasChatFacade(id)) {
      return this.getChatFacade(id);
    }

    const agent =
      (await this.resolveAgent(channel)) ?? this.agentManager.agents[0];
    const messages = await messageGateway.getAll(channel.id);
    const transport = new TauriChatTransport({
      providerName: agent.providerName as ProviderId,
      modelId: agent.model,
    });

    const facade = new ChatFacade({
      id,
      messages,
      transport,
    });

    this.setChatFacade(id, facade);
    return facade;
  }

  private async resolveAgent(
    channel: StorageChannel,
  ): Promise<StorageAgent | null> {
    const agentId = channel.agentId;
    const agent = this.agentManager.agents.find(a => a.id === agentId);

    if (!agent) {
      return null;
    }

    return agent;
  }
}
