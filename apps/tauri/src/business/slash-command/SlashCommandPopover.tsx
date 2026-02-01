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
import { Fzf } from 'fzf';
import { useEffect, useMemo, useState } from 'react';
import type { Subject } from 'rxjs';
import { SlashCommandManager } from './SlashCommandManager';
import type { SlashCommand } from './types';

type SlashCommandPopoverProps = {
  query: string;
  modifierKeyEvent$: Subject<'ArrowUp' | 'ArrowDown' | 'Enter'>;
  onSelect: (command: SlashCommand) => void;
  anchorRef: React.RefObject<HTMLTextAreaElement | null>;
};

export function SlashCommandPopover({
  query,
  onSelect,
  anchorRef,
  modifierKeyEvent$,
}: SlashCommandPopoverProps) {
  const [commands] = useState<SlashCommand[]>(
    SlashCommandManager.getInstance().getCommands(),
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const fzf = useMemo(
    () => new Fzf(commands, { selector: (cmd: SlashCommand) => cmd.name }),
    [commands],
  );

  const filteredCommands = useMemo(
    () => (query ? fzf.find(query).map(result => result.item) : commands),
    [fzf, query, commands],
  );

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
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          onSelect(selected);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [modifierKeyEvent$, filteredCommands, selectedIndex, onSelect]);

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
          value={filteredCommands[selectedIndex]?.name}
          onValueChange={() => {}}
        >
          <CommandList>
            <CommandEmpty>No matches found.</CommandEmpty>
            {filteredCommands.map(command => (
              <CommandItem
                key={command.id}
                value={command.name}
                onSelect={() => onSelect(command)}
              >
                <span className='text-sm font-medium w-[160px]'>
                  {command.name}
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
}
