import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@allin/ui';
import { useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Subject } from 'rxjs';
import { useSwrAtomValue } from '@/hooks/use-swr-atom-value';
import { dbAtoms } from '@/idb/db-store';
import { assert } from '@/utils/assert';

const DEFAULT_NAME = 'Untitled';

export const channelTitleOpenStatus$ = new Subject<boolean>();

export const ChannelTitle = () => {
  const selectedChannel = useSwrAtomValue(dbAtoms.selectedChannelAtom);
  const updateChannel = useSetAtom(dbAtoms.updateChannelAtom);
  assert(selectedChannel, 'CenterHeader: selectedChannel is not found.');

  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSubmit = useCallback(() => {
    const value = inputRef.current?.value;
    if (!value || value === selectedChannel.title) return;

    updateChannel(selectedChannel.id, {
      title: value,
    });
  }, [selectedChannel.id, selectedChannel.title, updateChannel]);

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

  useEffect(() => {
    const subscription = channelTitleOpenStatus$.subscribe(open => {
      setIsOpen(open);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const hasChannelTitle = Boolean(selectedChannel.title);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          size={'sm'}
          data-has-channel-title={hasChannelTitle}
          className='rounded-2xl backdrop-blur-md opacity-95 dark:aria-expanded:bg-input/80 dark:data-[has-channel-title=false]:text-muted-foreground/50'
        >
          {hasChannelTitle ? selectedChannel.title : DEFAULT_NAME}
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
  );
};
