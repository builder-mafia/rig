import { Bot, User } from 'lucide-react';
import type { AIEditChatMessage } from '../types';

type ChatMessageViewProps = {
  message: AIEditChatMessage;
};

export const ChatMessageView = ({ message }: ChatMessageViewProps) => {
  const isUser = message.role === 'user';

  return (
    <div className='flex items-start gap-2.5'>
      <div
        className={`flex size-[22px] shrink-0 items-center justify-center rounded-md ${
          isUser ? 'bg-blue-100 text-blue-600' : 'bg-foreground text-background'
        }`}
      >
        {isUser ? <User className='size-3.5' /> : <Bot className='size-3.5' />}
      </div>
      <div className='min-w-0 flex-1'>
        <div className='mb-0.5 text-[11px] font-semibold text-muted-foreground'>
          {isUser ? 'you' : 'assistant'}
        </div>
        <div className='text-sm leading-snug whitespace-pre-wrap'>
          {message.text}
        </div>
        {message.proposalId ? (
          <div className='mt-2 rounded-md border border-blue-200 bg-blue-50/60 px-2.5 py-2 text-xs text-blue-700'>
            Patch attached. Review the diff panel.
          </div>
        ) : null}
      </div>
    </div>
  );
};
