import { Button, ScrollArea } from '@allin/ui';
import { Check, Undo2, X } from 'lucide-react';
import type { AIEditHunk, AIEditHunkDecision } from '../types';

type HunkListViewProps = {
  hunks: AIEditHunk[];
  decisions: Map<string, AIEditHunkDecision>;
  onDecide: (hunkId: string, decision: AIEditHunkDecision) => void;
};

export const HunkListView = ({
  hunks,
  decisions,
  onDecide,
}: HunkListViewProps) => {
  return (
    <div className='flex h-full min-h-0 flex-col border-l bg-muted/20'>
      <div className='flex h-9 shrink-0 items-center border-b px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
        {hunks.length} hunks
      </div>
      <ScrollArea className='flex-1'>
        <ul className='flex flex-col'>
          {hunks.map((hunk, index) => {
            const decision = decisions.get(hunk.id) ?? 'pending';
            const add = hunk.lines.filter(line => line.kind === 'add').length;
            const del = hunk.lines.filter(line => line.kind === 'del').length;

            return (
              <li
                key={hunk.id}
                className={`group border-b px-3 py-2.5 ${
                  decision === 'applied'
                    ? 'bg-emerald-50/50'
                    : decision === 'rejected'
                      ? 'bg-rose-50/50 opacity-60'
                      : ''
                }`}
              >
                <div className='flex items-center gap-2'>
                  <span className='font-mono text-[10px] text-muted-foreground'>
                    #{index + 1}
                  </span>
                  <span className='truncate text-xs font-medium'>
                    {hunk.header}
                  </span>
                  <span className='ml-auto inline-flex items-center gap-1 font-mono text-[10px]'>
                    <span className='text-emerald-600'>+{add}</span>
                    <span className='text-rose-600'>-{del}</span>
                  </span>
                </div>
                <div className='mt-0.5 font-mono text-[10px] text-muted-foreground'>
                  line {hunk.origStart}
                </div>
                <div className='mt-2 flex items-center gap-1'>
                  {decision === 'pending' ? (
                    <>
                      <Button
                        size='sm'
                        variant='outline'
                        className='h-6 flex-1 text-[11px]'
                        onClick={() => onDecide(hunk.id, 'rejected')}
                      >
                        <X className='size-3' /> Reject
                      </Button>
                      <Button
                        size='sm'
                        className='h-6 flex-1 text-[11px]'
                        onClick={() => onDecide(hunk.id, 'applied')}
                      >
                        <Check className='size-3' /> Accept
                      </Button>
                    </>
                  ) : (
                    <Button
                      size='sm'
                      variant='ghost'
                      className='h-6 text-[11px]'
                      onClick={() => onDecide(hunk.id, 'pending')}
                    >
                      <Undo2 className='size-3' />
                      {decision === 'applied' ? 'Accepted' : 'Rejected'} · undo
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
};
