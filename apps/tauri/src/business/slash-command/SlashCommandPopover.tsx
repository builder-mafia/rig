'use client';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@allin/ui';
import { useEffect, useMemo, useRef, useState } from 'react';
import { slashCommandManager } from './SlashCommandManager';
import type {
  SlashCommand,
  SlashCommandCategory,
  TemplateSlashCommand,
} from './types';

type SlashCommandPopoverProps = {
  isOpen: boolean;
  onClose: () => void;
  currentInput: string;
  setInput: (value: string) => void;
  anchorRef: React.RefObject<HTMLTextAreaElement | null>;
};

type PopoverPhase =
  | { type: 'command-list' }
  | { type: 'hint-selection'; command: TemplateSlashCommand };

const CATEGORY_ORDER: SlashCommandCategory[] = [
  'ai',
  'tools',
  'general',
  'custom',
];

const CATEGORY_LABELS: Record<SlashCommandCategory, string> = {
  ai: 'AI',
  tools: 'Tools',
  general: 'General',
  custom: 'Custom',
};

export function SlashCommandPopover({
  isOpen,
  onClose,
  currentInput,
  setInput,
  anchorRef,
}: SlashCommandPopoverProps) {
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<PopoverPhase>({ type: 'command-list' });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setQuery('');
      setPhase({ type: 'command-list' });
    }
  }, [isOpen]);

  const filteredCommands = useMemo(
    () => slashCommandManager.getFilteredCommands(query),
    [query],
  );

  const groupedCommands = useMemo(() => {
    const groups = filteredCommands.reduce(
      (acc, cmd) => {
        const category = cmd.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(cmd);
        return acc;
      },
      {} as Record<string, SlashCommand[]>,
    );

    return Object.entries(groups).sort(
      ([a], [b]) =>
        CATEGORY_ORDER.indexOf(a as SlashCommandCategory) -
        CATEGORY_ORDER.indexOf(b as SlashCommandCategory),
    );
  }, [filteredCommands]);

  const handleSelectCommand = (command: SlashCommand) => {
    if (command.mode === 'action') {
      command.execute({ currentInput, setInput, close: onClose });
      return;
    }

    if (command.hints && command.hints.length > 0) {
      setPhase({ type: 'hint-selection', command });
      setQuery('');
      return;
    }

    setInput(`/${command.id} `);
    onClose();
  };

  const handleSelectHint = (hint: string) => {
    if (phase.type !== 'hint-selection') return;
    setInput(`/${phase.command.id} ${hint} `);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (phase.type === 'hint-selection') {
    const { command } = phase;
    const hints = command.hints ?? [];
    const filtered = query
      ? hints.filter(h => h.toLowerCase().includes(query.toLowerCase()))
      : hints;

    return (
      <Popover open={isOpen} onOpenChange={open => !open && handleClose()}>
        <PopoverAnchor virtualRef={anchorRef as React.RefObject<HTMLElement>} />
        <PopoverContent
          className='w-[320px] p-0'
          align='start'
          side='top'
          sideOffset={8}
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <Command shouldFilter={false}>
            <CommandInput
              ref={inputRef}
              placeholder={`Select for /${command.name}...`}
              value={query}
              onValueChange={setQuery}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setPhase({ type: 'command-list' });
                  setQuery('');
                }
              }}
            />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup heading={command.name}>
                {filtered.map(hint => (
                  <CommandItem
                    key={hint}
                    value={hint}
                    onSelect={() => handleSelectHint(hint)}
                  >
                    {hint}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={open => !open && handleClose()}>
      <PopoverAnchor virtualRef={anchorRef as React.RefObject<HTMLElement>} />
      <PopoverContent
        className='w-[320px] p-0'
        align='start'
        side='top'
        sideOffset={8}
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandInput
            ref={inputRef}
            placeholder='Search commands...'
            value={query}
            onValueChange={setQuery}
            onKeyDown={e => {
              if (e.key === 'Escape') handleClose();
            }}
          />
          <CommandList>
            <CommandEmpty>No commands found.</CommandEmpty>
            {groupedCommands.map(([category, commands]) => (
              <CommandGroup
                key={category}
                heading={
                  CATEGORY_LABELS[category as SlashCommandCategory] ?? category
                }
              >
                {commands.map(cmd => (
                  <CommandItem
                    key={cmd.id}
                    value={cmd.id}
                    onSelect={() => handleSelectCommand(cmd)}
                  >
                    {cmd.icon && (
                      <span className='mr-2 flex-shrink-0'>{cmd.icon}</span>
                    )}
                    <div className='flex flex-col'>
                      <span className='font-medium'>{cmd.name}</span>
                      <span className='text-xs text-muted-foreground'>
                        {cmd.description}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
