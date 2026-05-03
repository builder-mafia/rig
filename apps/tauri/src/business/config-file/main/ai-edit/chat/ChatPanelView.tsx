import { ScrollArea } from '@allin/ui';
import { Bot, Sparkles } from 'lucide-react';
import type { AIEditChatMessage, AIEditPhase } from '../types';
import { ChatComposerView } from './ChatComposerView';
import { ChatMessageView } from './ChatMessageView';

type ChatPanelViewProps = {
  phase: AIEditPhase;
  messages: AIEditChatMessage[];
  stats: { add: number; del: number; hunks: number };
  onSend: (prompt: string) => void;
};

export const ChatPanelView = ({
  phase,
  messages,
  stats,
  onSend,
}: ChatPanelViewProps) => {
  return (
    <div className='flex h-full min-h-0 flex-col bg-background'>
      <div className='flex h-11 shrink-0 items-center gap-2 border-b px-3'>
        <Sparkles className='size-4 text-blue-500' />
        <span className='text-sm font-semibold'>AI edit</span>
        <span className='ml-auto text-[11px] text-muted-foreground'>mock</span>
      </div>
      <ScrollArea className='min-h-0 flex-1'>
        <div className='flex flex-col gap-3 p-3 pb-1'>
          {messages.length === 0 ? (
            <EmptyConversationView />
          ) : (
            messages.map(message => (
              <ChatMessageView key={message.id} message={message} />
            ))
          )}
          {phase === 'working' ? <WorkingMessageView /> : null}
        </div>
      </ScrollArea>
      <div className='shrink-0 border-t p-3'>
        <ChatComposerView phase={phase} stats={stats} onSend={onSend} />
      </div>
    </div>
  );
};

const EmptyConversationView = () => {
  return (
    <div className='flex flex-col items-center justify-center gap-2 py-10 text-center'>
      <Sparkles className='size-5 text-muted-foreground' />
      <div className='text-xs text-muted-foreground'>
        Ask AI to refactor, translate, or fix this file.
      </div>
    </div>
  );
};

const WorkingMessageView = () => {
  return (
    <div className='flex items-start gap-2'>
      <div className='flex size-[22px] shrink-0 items-center justify-center rounded-md bg-foreground text-background'>
        <Bot className='size-3.5' />
      </div>
      <div className='flex h-[22px] items-center gap-1 px-1'>
        <span className='size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:0ms]' />
        <span className='size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:150ms]' />
        <span className='size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:300ms]' />
      </div>
    </div>
  );
};
