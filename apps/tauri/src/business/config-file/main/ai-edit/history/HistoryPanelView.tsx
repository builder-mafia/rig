import { Button, ScrollArea } from '@allin/ui';
import { History, X } from 'lucide-react';
import { useState } from 'react';
import type { AIEditVersionEntry } from '../types';
import { HistoryEntryView } from './HistoryEntryView';

type HistoryPanelViewProps = {
  versions: AIEditVersionEntry[];
  onClose: () => void;
};

export const HistoryPanelView = ({
  versions,
  onClose,
}: HistoryPanelViewProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(
    versions.find(version => version.current)?.id ?? versions[0]?.id ?? null,
  );

  return (
    <div className='flex h-full min-h-0 flex-col bg-background'>
      <div className='flex h-11 shrink-0 items-center gap-2 border-b px-3'>
        <History className='size-4 text-muted-foreground' />
        <span className='text-sm font-semibold'>Version history</span>
        <span className='ml-auto inline-flex'>
          <Button
            size='sm'
            variant='ghost'
            className='h-7 px-2'
            onClick={onClose}
            title='Close history'
          >
            <X className='size-4' />
          </Button>
        </span>
      </div>
      <ScrollArea className='min-h-0 flex-1'>
        <ul className='flex flex-col'>
          {versions.map(version => (
            <HistoryEntryView
              key={version.id}
              entry={version}
              selected={version.id === selectedId}
              onSelect={() => setSelectedId(version.id)}
            />
          ))}
        </ul>
      </ScrollArea>
      <div className='flex shrink-0 items-center gap-2 border-t bg-muted/30 px-3 py-2'>
        <span className='text-[11px] text-muted-foreground'>
          Version restore will be wired after file snapshot storage lands.
        </span>
        <Button size='sm' className='ml-auto h-7' disabled={!selectedId}>
          Restore
        </Button>
      </div>
    </div>
  );
};
