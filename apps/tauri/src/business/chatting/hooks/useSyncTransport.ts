import type { ProviderId } from '@allin/ai';
import { useEffect } from 'react';
import { EMPTY, map, of, skip, switchMap, take } from 'rxjs';
import { AgentManager } from '@/business/agent/AgentManager';
import type { ChatFacade } from '../facade/ChatFacade';
import { TauriChatTransport } from '../tauri-chat-transport';

export const useSyncTransport = (chatFacade: ChatFacade | null) => {
  useEffect(() => {
    if (!chatFacade) return;

    const agentManager = AgentManager.getInstance();
    const subscription = agentManager.selectedAgentId$
      // skip initial BehaviorSubject emission — facade is already created with the correct transport
      .pipe(
        skip(1),
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
  }, [chatFacade]);
};
