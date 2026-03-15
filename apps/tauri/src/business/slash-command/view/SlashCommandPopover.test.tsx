import { act, cleanup, screen } from '@testing-library/react';
import { Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithServices } from '@/test-utils/renderWithServices';
import type { SlashCommand } from '../ISlashCommand';
import { SlashCommandManager } from '../SlashCommandManager';
import type { SlashCommandExecuteResult } from './SlashCommandPopover';
import { SlashCommandPopover } from './SlashCommandPopover';

vi.mock('@allin/ui', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='popover'>{children}</div>
  ),
  PopoverAnchor: () => null,
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='popover-content'>{children}</div>
  ),
  Command: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value?: string;
    shouldFilter?: boolean;
    onValueChange?: () => void;
  }) => (
    <div data-testid='command' data-value={value}>
      {children}
    </div>
  ),
  CommandList: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='command-list'>{children}</div>
  ),
  CommandEmpty: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='command-empty'>{children}</div>
  ),
  CommandItem: ({
    children,
    value,
    onSelect,
  }: {
    children: React.ReactNode;
    value?: string;
    onSelect?: () => void;
  }) => (
    <button
      type='button'
      data-testid={`command-item-${value}`}
      onClick={onSelect}
    >
      {children}
    </button>
  ),
}));

const testCommands: SlashCommand[] = [
  {
    id: 'cmd-a',
    commandName: 'alpha',
    description: 'First command',
    mode: 'template',
    template: '$ARGS',
    toPrompt: () => '',
  },
  {
    id: 'cmd-b',
    commandName: 'beta',
    description: 'Second command',
    mode: 'template',
    template: '$ARGS',
    toPrompt: () => '',
  },
  {
    id: 'cmd-c',
    commandName: 'charlie',
    description: 'Third command',
    mode: 'template',
    template: '$ARGS',
    toPrompt: () => '',
  },
];

function setup(query = '') {
  const modifierKeyEvent$ = new Subject<'ArrowUp' | 'ArrowDown' | 'Enter'>();
  const onExecute = vi.fn<(result: SlashCommandExecuteResult) => void>();
  const anchorRef = { current: document.createElement('textarea') };

  const manager = SlashCommandManager.getInstance();
  for (const cmd of manager.getCommands()) {
    manager.unregisterCommand(cmd.id);
  }
  manager.registerCommands(testCommands);

  const result = renderWithServices(
    <SlashCommandPopover
      query={query}
      modifierKeyEvent$={modifierKeyEvent$}
      onExecute={onExecute}
      anchorRef={anchorRef}
    />,
    { slashCommandManager: manager },
  );

  return { modifierKeyEvent$, onExecute, ...result };
}

describe('SlashCommandPopover', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders all commands when query is empty', () => {
    setup();
    expect(screen.getByTestId('command-item-alpha')).toBeDefined();
    expect(screen.getByTestId('command-item-beta')).toBeDefined();
    expect(screen.getByTestId('command-item-charlie')).toBeDefined();
  });

  it('selects first command by default', () => {
    setup();
    const command = screen.getByTestId('command');
    expect(command.getAttribute('data-value')).toBe('alpha');
  });

  it('ArrowDown moves selection to next command', () => {
    const { modifierKeyEvent$ } = setup();

    act(() => modifierKeyEvent$.next('ArrowDown'));

    const command = screen.getByTestId('command');
    expect(command.getAttribute('data-value')).toBe('beta');
  });

  it('ArrowDown wraps from last to first', () => {
    const { modifierKeyEvent$ } = setup();

    act(() => {
      modifierKeyEvent$.next('ArrowDown');
      modifierKeyEvent$.next('ArrowDown');
    });

    const command = screen.getByTestId('command');
    expect(command.getAttribute('data-value')).toBe('charlie');

    act(() => modifierKeyEvent$.next('ArrowDown'));
    expect(command.getAttribute('data-value')).toBe('alpha');
  });

  it('ArrowUp wraps from first to last', () => {
    const { modifierKeyEvent$ } = setup();

    act(() => modifierKeyEvent$.next('ArrowUp'));

    const command = screen.getByTestId('command');
    expect(command.getAttribute('data-value')).toBe('charlie');
  });

  it('ArrowUp moves selection to previous command', () => {
    const { modifierKeyEvent$ } = setup();

    act(() => {
      modifierKeyEvent$.next('ArrowDown');
      modifierKeyEvent$.next('ArrowDown');
      modifierKeyEvent$.next('ArrowUp');
    });

    const command = screen.getByTestId('command');
    expect(command.getAttribute('data-value')).toBe('beta');
  });

  it('Enter calls onExecute with result of first command', () => {
    const { modifierKeyEvent$, onExecute } = setup();

    act(() => modifierKeyEvent$.next('Enter'));

    expect(onExecute).toHaveBeenCalledTimes(1);
    expect(onExecute).toHaveBeenCalledWith({
      type: 'template',
      inputValue: '/alpha ',
    });
  });

  it('Enter after ArrowDown calls onExecute with result of second command', () => {
    const { modifierKeyEvent$, onExecute } = setup();

    act(() => modifierKeyEvent$.next('ArrowDown'));
    act(() => modifierKeyEvent$.next('Enter'));

    expect(onExecute).toHaveBeenCalledTimes(1);
    expect(onExecute).toHaveBeenCalledWith({
      type: 'template',
      inputValue: '/beta ',
    });
  });

  it('filters commands by query using fzf', () => {
    setup('alp');

    expect(screen.getByTestId('command-item-alpha')).toBeDefined();
    expect(screen.queryByTestId('command-item-beta')).toBeNull();
    expect(screen.queryByTestId('command-item-charlie')).toBeNull();
  });
});
