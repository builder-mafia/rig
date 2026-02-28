import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useService } from '@/business/ServiceContext';
import type { AgentProps } from './AgentManager';
import type { Agent } from './types';

export const useAgent = () => {
  const { agentManager } = useService();

  const subscribeToAgents = useCallback(
    (onChange: () => void) => {
      const subscription = agentManager.agents$.subscribe(onChange);
      return () => subscription.unsubscribe();
    },
    [agentManager],
  );
  const getAgentsSnapshot = useCallback(
    () => agentManager.agents,
    [agentManager],
  );
  const agents = useSyncExternalStore(
    subscribeToAgents,
    getAgentsSnapshot,
    getAgentsSnapshot,
  );

  const subscribeToSelectedAgentId = useCallback(
    (onChange: () => void) => {
      const subscription = agentManager.selectedAgentId$.subscribe(onChange);
      return () => subscription.unsubscribe();
    },
    [agentManager],
  );

  const getSelectedAgentIdSnapshot = useCallback(
    () => agentManager.selectedAgentId,
    [agentManager],
  );

  const selectedAgentId = useSyncExternalStore(
    subscribeToSelectedAgentId,
    getSelectedAgentIdSnapshot,
    getSelectedAgentIdSnapshot,
  );

  const selectedAgent = useMemo(() => {
    return agents.find(a => a.id === selectedAgentId) ?? null;
  }, [agents, selectedAgentId]);

  const setSelectedAgentId = useCallback(
    (agentId: string) => {
      agentManager.setSelectedAgent(agentId);
    },
    [agentManager],
  );

  const cycleSelectedAgent = useCallback(() => {
    agentManager.cycleSelectedAgent();
  }, [agentManager]);

  const getAgentById = useCallback(
    (agentId: string) => agents.find(a => a.id === agentId) ?? null,
    [agents],
  );

  const updateAgent = useCallback(
    (agentId: string, params: Partial<AgentProps>) => {
      agentManager.update(agentId, params);
    },
    [agentManager],
  );

  return {
    agents,
    selectedAgent,
    setSelectedAgentId,
    cycleSelectedAgent,
    getAgentById,
    updateAgent,
  };
};
