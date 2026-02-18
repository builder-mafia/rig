import { useEffect } from 'react';
import { useService } from '@/business/ServiceContext';

export const useAgentInit = () => {
  const { agentManager } = useService();

  useEffect(() => {
    const init = async () => {
      const agents = await agentManager.loadAgents();
      agentManager.setSelectedAgent(agents[0].id);
    };

    init();
  }, [agentManager]);
};
