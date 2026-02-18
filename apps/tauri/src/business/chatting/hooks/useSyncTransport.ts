import type { ProviderId } from '@allin/ai';
import { useEffect } from 'react';
import { EMPTY, map, of, switchMap, take } from 'rxjs';
import { useService } from '@/business/ServiceContext';
import type { ChatFacade } from '../facade/ChatFacade';
import { TauriChatTransport } from '../tauri-chat-transport';

export const useSyncTransport = (chatFacade: ChatFacade | null) => {
  const { agentManager } = useService();

  useEffect(() => {
    if (!chatFacade) return;
    const subscription = agentManager.selectedAgentId$
      .pipe(
        switchMap(agentId => {
          if (!agentId) return EMPTY;

          const agent = agentManager.agents.find(a => a.id === agentId);
          if (!agent) return EMPTY;

          const status = chatFacade.getStatus();
          if (status === 'streaming' || status === 'submitted') {
            // wait for streaming to finish before updating transport
            // pure Observable allows switchMap to truly cancel on new agent change
            return chatFacade.finish$.pipe(
              take(1),
              map(() => agent),
            );
          }

          return of(agent);
        }),
      )
      .subscribe(agent => {
        const transport = new TauriChatTransport({
          providerName: agent.providerName as ProviderId,
          modelId: agent.model,
        });
        chatFacade.updateTransport(transport);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [chatFacade, agentManager]);
};
