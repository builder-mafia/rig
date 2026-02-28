import { StateSubject } from '@allin/utils';
import { v4 } from 'uuid';
import { agentGateway } from '@/lib/gateway/agent/agentGateway';
import type { StorageAgent } from '@/lib/gateway/agent/types';
import type { Agent } from './types';

export type AgentProps = Omit<StorageAgent, 'id' | 'createdAt' | 'updatedAt'>;

export class AgentManager {
  private static instance: AgentManager;
  private _agents$ = new StateSubject<Agent[]>([]);
  private _selectedAgentId$ = new StateSubject<string | null>('');

  private constructor() {}

  public static getInstance() {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  public get selectedAgentId() {
    return this._selectedAgentId$.getValue();
  }
  public get selectedAgentId$() {
    return this._selectedAgentId$.asObservable();
  }
  public get selectedAgent() {
    return this.agents.find(a => a.id === this.selectedAgentId) ?? null;
  }

  public get agents() {
    return this._agents$.getValue();
  }
  public get agents$() {
    return this._agents$.asObservable();
  }
  private setAgents(agents: Agent[]) {
    this._agents$.next(agents);
  }

  public async loadAgents() {
    const agents = await agentGateway.getAll();
    agents.sort((a, b) => b.createdAt - a.createdAt);
    this.setAgents(agents);
    return agents;
  }

  public setSelectedAgent(agentId: string) {
    if (!this.agents.map(a => a.id).includes(agentId)) {
      throw new Error(`Agent with id ${agentId} not found`);
    }
    this._selectedAgentId$.next(agentId);
  }

  public async create(params: AgentProps) {
    const now = Date.now();
    const id = v4();
    await agentGateway.create({
      ...params,
      id,
      createdAt: now,
      updatedAt: now,
    });
    await this.loadAgents();
    this.setSelectedAgent(id);
    return id;
  }

  public async update(agentId: string, params: Partial<AgentProps>) {
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) {
      throw new Error(`Agent with id ${agentId} not found`);
    }
    await agentGateway.update({
      ...agent,
      ...params,
      updatedAt: Date.now(),
    });
    await this.loadAgents();
    this.setSelectedAgent(agentId);
  }

  public async delete(agentId: string) {
    await agentGateway.delete(agentId);
    const agents = await this.loadAgents();

    if (!agents.map(a => a.id).includes(this.selectedAgentId ?? '')) {
      this.setSelectedAgent(agents[0].id);
    }
  }

  public cycleSelectedAgent() {
    if (this.agents.length <= 1) {
      return;
    }

    const currentIndex = this.agents
      .map(a => a.id)
      .indexOf(this.selectedAgentId ?? '');
    if (currentIndex === -1) {
      return;
    }

    const nextIndex = (currentIndex + 1) % this.agents.length;
    this.setSelectedAgent(this.agents[nextIndex].id);
  }
}
