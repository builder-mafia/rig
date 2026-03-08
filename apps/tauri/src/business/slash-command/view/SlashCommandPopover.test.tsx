import { act, cleanup, render, screen } from '@testing-library/react';
import { Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SlashCommand } from '../ISlashCommand';
import { SlashCommandManager } from '../SlashCommandManager';
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
    commandName: 'Alpha',
    description: 'First command',
    mode: 'template',
    template: '$INPUT',
    toPrompt: () => '',
  },
  {
    id: 'cmd-b',
    commandName: 'Beta',
    description: 'Second command',
    mode: 'template',
    template: '$INPUT',
    toPrompt: () => '',
  },
];

function setup(query = '') {
  const modifierKeyEvent$ = new Subject<'ArrowUp' | 'ArrowDown' | 'Enter'>();
  const onSelect = vi.fn();
  const anchorRef = { current: document.createElement('textarea') };

  const manager = SlashCommandManager.getInstance();
  for (const cmd of manager.getCommands()) {
    manager.unregisterCommand(cmd.id);
  }
  manager.registerCommands(testCommands);

  const result = render(
    <SlashCommandPopover
      query={query}
      modifierKeyEvent$={modifierKeyEvent$}
      onSelect={onSelect}
      anchorRef={anchorRef}
    />,
  );

  return { modifierKeyEvent$, onSelect, ...result };
}

describe('SlashCommandPopover', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders all commands when query is empty', () => {
    setup();
    expect(screen.getByTestId('command-item-Alpha')).toBeDefined();
    expect(screen.getByTestId('command-item-Beta')).toBeDefined();
    expect(screen.getByTestId('command-item-Charlie')).toBeDefined();
  });

  it('selects first command by default', () => {
    setup();
    const command = screen.getByTestId('command');
    expect(command.getAttribute('data-value')).toBe('Alpha');
  });

  it('ArrowDown moves selection to next command', () => {
    const { modifierKeyEvent$ } = setup();

    act(() => modifierKeyEvent$.next('ArrowDown'));

    const command = screen.getByTestId('command');
    expect(command.getAttribute('data-value')).toBe('Beta');
  });

  it('ArrowDown wraps from last to first', () => {
    const { modifierKeyEvent$ } = setup();

    act(() => {
      modifierKeyEvent$.next('ArrowDown');
      modifierKeyEvent$.next('ArrowDown');
    });

    const command = screen.getByTestId('command');
    expect(command.getAttribute('data-value')).toBe('Charlie');

    act(() => modifierKeyEvent$.next('ArrowDown'));
    expect(command.getAttribute('data-value')).toBe('Alpha');
  });

  it('ArrowUp wraps from first to last', () => {
    const { modifierKeyEvent$ } = setup();

    act(() => modifierKeyEvent$.next('ArrowUp'));

    const command = screen.getByTestId('command');
    expect(command.getAttribute('data-value')).toBe('Charlie');
  });

  it('ArrowUp moves selection to previous command', () => {
    const { modifierKeyEvent$ } = setup();

    act(() => {
      modifierKeyEvent$.next('ArrowDown');
      modifierKeyEvent$.next('ArrowDown');
      modifierKeyEvent$.next('ArrowUp');
    });

    const command = screen.getByTestId('command');
    expect(command.getAttribute('data-value')).toBe('Beta');
  });

  it('Enter calls onSelect with currently selected command', () => {
    const { modifierKeyEvent$, onSelect } = setup();

    act(() => modifierKeyEvent$.next('Enter'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(testCommands[0]);
  });

  it('Enter after ArrowDown calls onSelect with second command', () => {
    const { modifierKeyEvent$, onSelect } = setup();

    act(() => modifierKeyEvent$.next('ArrowDown'));
    act(() => modifierKeyEvent$.next('Enter'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(testCommands[1]);
  });

  it('filters commands by query using fzf', () => {
    setup('alp');

    expect(screen.getByTestId('command-item-Alpha')).toBeDefined();
    expect(screen.queryByTestId('command-item-Beta')).toBeNull();
    expect(screen.queryByTestId('command-item-Charlie')).toBeNull();
  });
});
