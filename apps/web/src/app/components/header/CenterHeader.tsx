import { useSetAtom } from 'jotai';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSwrAtomValue } from '@/hooks/use-swr-atom-value';
import { dbAtoms } from '@/idb/db-store';
import { assertDefined } from '@/utils/assert';

export const CenterHeader = () => {
  const selectedChannel = useSwrAtomValue(dbAtoms.selectedChannelAtom);
  const updateSelectedChannel = useSetAtom(dbAtoms.selectedChannelAtom);
  assertDefined(selectedChannel, 'CenterHeader: selectedChannel is not found.');

  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSubmit = useCallback(() => {
    const value = inputRef.current?.value;
    if (!value) return;

    updateSelectedChannel({
      title: value,
    });
  }, [updateSelectedChannel]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !(e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onSubmit();
        setIsOpen(false);
      }
    },
    [onSubmit],
  );

  return (
    <div className='w-full flex absolute justify-center z-10 h-12'>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            size={'sm'}
            className='mt-1 rounded-2xl backdrop-blur-md opacity-95 dark:aria-expanded:bg-input/80'
          >
            {selectedChannel.title ?? selectedChannel.id}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align='center'
          side='bottom'
          sideOffset={4}
          className='w-92'
          asChild
        >
          <Input
            ref={inputRef}
            onFocus={() => {
              inputRef.current?.select();
            }}
            className='focus-visible:ring-0 rounded-2xl bg-accent dark:bg-card/90 backdrop-blur-xs'
            placeholder='Chat title'
            aria-selected={true}
            defaultValue={selectedChannel.title ?? ''}
            onBlur={onSubmit}
            onKeyDown={onKeyDown}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
