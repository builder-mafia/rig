import { BehaviorSubject } from 'rxjs';
import { agentGateway } from '@/lib/gateway/agent/agentGateway';
import type { AgentPreset } from './types';

export class AgentManager {
  private static instance: AgentManager;

  private initialized = false;
  private _agents$ = new BehaviorSubject<AgentPreset[]>([]);
  private _activeAgentId$ = new BehaviorSubject<string>('');

  private constructor() {}
  private updateActiveAgentId(agentId: string) {
    this._activeAgentId$.next(agentId);
  }

  public static getInstance() {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  public async initialize() {
    if (this.initialized) return;
    this.initialized = true;

    await this.loadAgents();
  }

  public get activeAgentId() {
    return this._activeAgentId$.getValue();
  }
  public get activeAgentId$() {
    return this._activeAgentId$.asObservable();
  }
  public get activeAgent() {
    return this.agents.find(a => a.id === this.activeAgentId) ?? null;
  }

  public get agents() {
    return this._agents$.getValue();
  }
  public get agents$() {
    return this._agents$.asObservable();
  }

  private async loadAgents() {
    const agents = await agentGateway.getAll();
    agents.sort((a, b) => a.createdAt - b.createdAt);
    this._agents$.next(agents);
    this.updateActiveAgentId(agents[0].id);
    return agents;
  }

  public async delete(agentId: string) {
    await agentGateway.delete(agentId);
    const agents = await this.loadAgents();

    if (!agents.map(a => a.id).includes(this.activeAgentId)) {
      this.updateActiveAgentId(agents[0].id);
    }
  }

  public cycleNext() {
    if (this.agents.length <= 1) {
      return;
    }

    const currentIndex = this.agents.map(a => a.id).indexOf(this.activeAgentId);
    if (currentIndex === -1) {
      return;
    }

    const nextIndex = (currentIndex + 1) % this.agents.length;
    this.updateActiveAgentId(this.agents[nextIndex].id);
  }
}
