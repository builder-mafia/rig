import { useAtom } from 'jotai';
import { useAIEditContext } from '../main/ai-edit/AIEditContext';
import { ChatPanelView } from '../main/ai-edit/chat/ChatPanelView';
import { HistoryPanelView } from '../main/ai-edit/history/HistoryPanelView';
import { rightDockPaneAtom } from '../rightDockAtom';

export const RightDockView = () => {
  const { ai, versions } = useAIEditContext();
  const [rightDockPane, setRightDockPane] = useAtom(rightDockPaneAtom);

  return (
    <aside className='min-h-0 w-[360px] shrink-0 border-l bg-background'>
      {rightDockPane === 'chat' ? (
        <ChatPanelView
          phase={ai.phase}
          messages={ai.messages}
          stats={ai.stats}
          onSend={prompt => void ai.send(prompt)}
        />
      ) : (
        <HistoryPanelView
          versions={versions}
          onClose={() => setRightDockPane('chat')}
        />
      )}
    </aside>
  );
};
