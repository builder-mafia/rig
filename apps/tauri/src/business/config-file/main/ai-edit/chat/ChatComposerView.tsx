import {
  Button,
  Kbd,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@allin/ui';
import { Lock, Send, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { AIEditPhase } from '../types';

type ChatComposerViewProps = {
  phase: AIEditPhase;
  stats: { add: number; del: number; hunks: number };
  onSend: (prompt: string) => void;
};

export const ChatComposerView = ({
  phase,
  stats,
  onSend,
}: ChatComposerViewProps) => {
  const [draft, setDraft] = useState('');
  const disabled = phase !== 'idle';

  const handleSend = () => {
    const text = draft.trim();
    if (!text || disabled) {
      return;
    }

    onSend(text);
    setDraft('');
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className='rounded-lg border bg-card p-2.5'>
      <Textarea
        value={draft}
        onChange={event => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        rows={2}
        disabled={disabled}
        placeholder={
          phase === 'proposal-pending'
            ? `Reviewing AI proposal (${stats.hunks} hunks). Accept or reject first.`
            : phase === 'working'
              ? 'AI is working...'
              : '이 파일을 어떻게 바꿀까요?'
        }
        className='min-h-[44px] resize-none border-0 px-1 py-0 text-sm shadow-none focus-visible:ring-0'
      />
      <div className='mt-1 flex items-center gap-2'>
        <span className='inline-flex items-center gap-1 text-[11px] text-muted-foreground'>
          <Sparkles className='size-3' /> mock AI edit
        </span>
        <span className='flex-1' />
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                size='sm'
                variant='default'
                disabled={disabled || !draft.trim()}
                onClick={handleSend}
                className='h-7'
              >
                {disabled ? (
                  <Lock className='size-3.5' />
                ) : (
                  <Send className='size-3.5' />
                )}
                Send
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side='top'>
            {disabled ? (
              'Reviewing AI proposal. Accept or reject first.'
            ) : (
              <span className='inline-flex items-center gap-1'>
                Send <Kbd>⌘</Kbd>
                <Kbd>↵</Kbd>
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
