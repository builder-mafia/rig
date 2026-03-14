'use client';

import {
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@allin/ui';
import { useEffect, useState } from 'react';
import type { Subject } from 'rxjs';
import {
  type SlashCommandExecuteResult,
  useSlashCommandExecutor,
} from '../hooks/useSlashCommandExecutor';
import { useSlashCommandSearch } from '../hooks/useSlashCommandSearch';

export type { SlashCommandExecuteResult };

type SlashCommandPopoverProps = {
  query: string;
  modifierKeyEvent$: Subject<'ArrowUp' | 'ArrowDown' | 'Enter'>;
  onExecute: (result: SlashCommandExecuteResult) => void;
  anchorRef: React.RefObject<HTMLTextAreaElement | null>;
};

export const SlashCommandPopover = ({
  query,
  onExecute,
  anchorRef,
  modifierKeyEvent$,
}: SlashCommandPopoverProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const filteredCommands = useSlashCommandSearch(query);
  const { execute } = useSlashCommandExecutor();

  const handleSelect = (index: number) => {
    const selected = filteredCommands[index];
    if (selected) {
      onExecute(execute(selected));
    }
  };

  useEffect(() => {
    const subscription = modifierKeyEvent$.subscribe(key => {
      if (key === 'ArrowUp') {
        setSelectedIndex(prev =>
          prev <= 0 ? filteredCommands.length - 1 : prev - 1,
        );
      }
      if (key === 'ArrowDown') {
        setSelectedIndex(prev =>
          prev >= filteredCommands.length - 1 ? 0 : prev + 1,
        );
      }
      if (key === 'Enter') {
        handleSelect(selectedIndex);
      }
    });

    return () => subscription.unsubscribe();
  }, [modifierKeyEvent$, filteredCommands, selectedIndex, onExecute]);

  return (
    <Popover open>
      <PopoverAnchor virtualRef={anchorRef as React.RefObject<HTMLElement>} />
      <PopoverContent
        className='w-[calc(680px)] p-0'
        align='start'
        side='top'
        sideOffset={8}
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <Command
          shouldFilter={false}
          value={filteredCommands[selectedIndex]?.commandName}
          onValueChange={() => {}}
        >
          <CommandList>
            <CommandEmpty>No matches found.</CommandEmpty>
            {filteredCommands.map((command, i) => (
              <CommandItem
                key={command.id}
                value={command.commandName}
                onSelect={() => handleSelect(i)}
              >
                <span className='text-sm font-medium w-[160px]'>
                  {command.commandName}
                </span>
                <span className='text-xs text-muted-foreground'>
                  {command.description}
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
