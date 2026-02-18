import { StateSubject } from '@allin/utils';
import type { AgentManager } from '@/business/agent/AgentManager';
import type { Agent } from '@/business/agent/types';

type CreateMockAgentManagerParams = {
  agents?: Agent[];
  selectedAgentId?: string | null;
};

export const createMockAgentManager = (
  params: CreateMockAgentManagerParams = {},
): AgentManager => {
  const { agents: initialAgents = [], selectedAgentId = null } = params;

  const selectedAgentId$ = new StateSubject<string | null>(selectedAgentId);
  const agents = initialAgents;

  const mock = {
    get selectedAgentId$() {
      return selectedAgentId$.asObservable();
    },
    get selectedAgentId() {
      return selectedAgentId$.getValue();
    },
    get agents() {
      return agents;
    },
    get selectedAgent() {
      return agents.find(a => a.id === selectedAgentId$.getValue()) ?? null;
    },
    setSelectedAgent: (id: string | null) => {
      selectedAgentId$.next(id);
    },
  };

  return mock as unknown as AgentManager;
};
