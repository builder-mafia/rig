'use client';

import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { useChannel } from '@/business/chatting/channel/useChannel';
import { useAIEditContext } from '../main/ai-edit/AIEditContext';
import { AIPanel } from '../main/ai-edit/chat/AIPanel';
import { HistoryPanelView } from '../main/ai-edit/history/HistoryPanelView';
import { rightDockPaneAtom } from '../rightDockAtom';

export const RightDockView = () => {
  const [rightDockPane, setRightDockPane] = useAtom(rightDockPaneAtom);
  const { versions } = useAIEditContext();
  const { createNewChannel } = useChannel();
  const { data: channel } = useQuery({
    queryKey: ['config-file-ai-edit-channel'],
    queryFn: createNewChannel,
    staleTime: Infinity,
  });

  return (
    <aside className='min-h-0 w-[360px] shrink-0 border-l bg-background'>
      {rightDockPane === 'chat' && channel ? (
        <AIPanel channel={channel} />
      ) : rightDockPane === 'history' ? (
        <HistoryPanelView
          versions={versions}
          onClose={() => setRightDockPane('chat')}
        />
      ) : (
        <div className='flex h-full items-center justify-center text-xs text-muted-foreground'>
          Loading AI chat...
        </div>
      )}
    </aside>
  );
};
