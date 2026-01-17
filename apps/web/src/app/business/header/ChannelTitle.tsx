import {
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@allin/ui';
import { useSetAtom } from 'jotai';
import { Loader2, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Subject } from 'rxjs';
import { toast } from 'sonner';
import { useSwrAtomValue } from '@/hooks/use-swr-atom-value';
import { dbAtoms } from '@/idb/db-store';
import { assert } from '@/utils/assert';

const DEFAULT_NAME = 'Untitled';

export const channelTitleOpenStatus$ = new Subject<boolean>();

export const ChannelTitle = () => {
  const selectedChannel = useSwrAtomValue(dbAtoms.selectedChannelAtom);
  const updateChannel = useSetAtom(dbAtoms.updateChannelAtom);
  const selectedChannelMessages = useSwrAtomValue(
    dbAtoms.selectedChannelMessagesAtom,
  );
  assert(selectedChannel, 'CenterHeader: selectedChannel is not found.');

  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasMessages = selectedChannelMessages.length > 0;

  const handleGenerateTitle = useCallback(async () => {
    if (!hasMessages || isGenerating) return;
    toast.info('Title generation is temporarily disabled.');
  }, [hasMessages, isGenerating]);

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
        className='w-92 p-0'
      >
        <InputGroup className='rounded-2xl bg-accent dark:bg-card/90 backdrop-blur-xs'>
          <InputGroupInput
            ref={inputRef}
            onFocus={() => {
              inputRef.current?.select();
            }}
            placeholder='Chat title'
            aria-selected={true}
            defaultValue={selectedChannel.title ?? ''}
            onBlur={onSubmit}
            onKeyDown={onKeyDown}
          />
          <InputGroupAddon align='inline-end'>
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton
                  size='icon-xs'
                  onClick={handleGenerateTitle}
                  disabled={!hasMessages || isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className='animate-spin' />
                  ) : (
                    <Sparkles />
                  )}
                </InputGroupButton>
              </TooltipTrigger>
              <TooltipContent>
                {hasMessages
                  ? 'Generate title with AI'
                  : 'Send a message first to generate title'}
              </TooltipContent>
            </Tooltip>
          </InputGroupAddon>
        </InputGroup>
      </PopoverContent>
    </Popover>
  );
};
