import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SkillList, type SkillListProps } from './components/SkillList';
import { RepositorySelector } from './components/RepositorySelector';
import { getSkillsInFolder } from './skillRemoval';
import type { Skill, SkillRoot } from './types';
import { useRemoveSkill } from './useRemoveSkill';

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));
vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }));
vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));
vi.mock('@allin/ui', async importOriginal => ({
  ...(await importOriginal<object>()),
  toast: mocks.toast,
}));

const skill = (
  relativePath: string,
  overrides: Partial<Skill> = {},
): Skill => ({
  id: relativePath,
  name: relativePath.split('/').at(-1) || 'root',
  description: 'instructions',
  content: '# Skill',
  rootPath: '/work/demo',
  relativePath,
  isValid: true,
  validationError: null,
  updatedAt: null,
  isArchived: false,
  provider: 'repository',
  scopeId: '/work/demo',
  scopeLabel: 'demo',
  scopeKind: 'repository',
  rootId: 'demo',
  rootLabel: 'demo',
  ...overrides,
});

const mountList = (
  skills: Skill[],
  overrides: Partial<SkillListProps> = {},
) => {
  const props: SkillListProps = {
    skills,
    hiddenSkills: [],
    hiddenFolderPaths: new Set(),
    onFolderVisibilityChange: vi.fn(),
    selectedSkillIds: new Set(),
    isLoading: false,
    error: null,
    onSelectionChange: vi.fn(),
    onClearSelection: vi.fn(),
    onRemoveSkills: vi.fn(),
    removingSkillIds: new Set(),
    onHideSkills: vi.fn(),
    onShowSkills: vi.fn(),
    showingHidden: false,
    onShowingHiddenChange: vi.fn(),
    ...overrides,
  };
  render(<SkillList {...props} />);
  return props;
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mocks.invoke.mockReset();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('folder skill deletion', () => {
  it('matches full folder boundaries, deduplicates overlapping roots, and excludes archived files', () => {
    const a = skill('tools/a');
    const alias = skill('a', { rootPath: '/work/demo/tools' });
    const nested = skill('tools/nested/b');
    expect(
      getSkillsInFolder(
        [
          a,
          alias,
          nested,
          skill('tools-other/c'),
          skill('tools/archive', { isArchived: true }),
        ],
        '/work/demo/tools/',
      ),
    ).toEqual([alias, nested]);
    expect(getSkillsInFolder([a], '')).toEqual([]);
    expect(getSkillsInFolder([a], '/work/other/tools')).toEqual([]);
  });

  it('confirms all descendants including hidden and filtered skills before Enter deletes', async () => {
    const a = skill('tools/alpha');
    const b = skill('tools/nested/beta');
    const hidden = skill('tools/hidden');
    const props = mountList([a, b, skill('tools-other/sibling')], {
      hiddenSkills: [hidden],
    });
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'alpha' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'tools 1' }));
    fireEvent.contextMenu(screen.getByRole('button', { name: 'tools 1' }));
    fireEvent.click(
      screen.getByRole('menuitem', { name: 'Delete all skills…' }),
    );
    const dialog = await screen.findByRole('alertdialog');
    expect(
      within(dialog).getByText('Delete all 3 skills in “tools”?'),
    ).toBeTruthy();
    expect(within(dialog).getByText('/work/demo/tools')).toBeTruthy();
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(3);
    expect(within(dialog).queryByText('sibling')).toBeNull();
    expect(props.onRemoveSkills).not.toHaveBeenCalled();
    const button = within(dialog).getByRole('button', { name: 'Delete' });
    await waitFor(() => expect(document.activeElement).toBe(button));
    expect(button.className).toContain('border-destructive/60');
    expect(button.className).toContain('bg-transparent');
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(props.onRemoveSkills).toHaveBeenCalledExactlyOnceWith(
      [a, b, hidden],
      '/work/demo/tools',
    );
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it.each(['Cancel', 'Escape'])(
    'does not delete when folder confirmation is dismissed with %s',
    async action => {
      const props = mountList([skill('tools/alpha')]);
      fireEvent.contextMenu(screen.getByRole('button', { name: 'tools 1' }));
      fireEvent.click(
        screen.getByRole('menuitem', { name: 'Delete all skills…' }),
      );
      const dialog = await screen.findByRole('alertdialog');
      if (action === 'Cancel')
        fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
      else fireEvent.keyDown(dialog, { key: 'Escape' });
      expect(props.onRemoveSkills).not.toHaveBeenCalled();
      await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    },
  );

  it('keeps single-skill confirmation keyboard-ready while ignoring held Enter and IME composition', async () => {
    const a = skill('alpha');
    const props = mountList([a]);
    fireEvent.contextMenu(
      screen.getByRole('button', { name: 'alpha instructions' }),
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete skill…' }));
    const dialog = await screen.findByRole('alertdialog');
    const button = within(dialog).getByRole('button', { name: 'Delete' });
    await waitFor(() => expect(document.activeElement).toBe(button));
    fireEvent.keyDown(button, { key: 'Enter', repeat: true });
    fireEvent.keyDown(button, { key: 'Enter', isComposing: true });
    expect(props.onRemoveSkills).not.toHaveBeenCalled();
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(props.onRemoveSkills).toHaveBeenCalledExactlyOnceWith(
      [a],
      undefined,
    );
  });

  it('uses the full scanned set even when a source is hidden', async () => {
    const a = skill('tools/alpha');
    const sourceHidden = skill('tools/.claude/skills/review');
    const props = mountList([a], { allSkills: [a, sourceHidden] });
    fireEvent.contextMenu(screen.getByRole('button', { name: 'tools 1' }));
    fireEvent.click(
      screen.getByRole('menuitem', { name: 'Delete all skills…' }),
    );
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(2);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(props.onRemoveSkills).toHaveBeenCalledWith(
      [a, sourceHidden],
      '/work/demo/tools',
    );
  });
});

describe('bulk deletion results', () => {
  const mountRemoval = () => {
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const onRemoved = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return {
      ...renderHook(() => useRemoveSkill({ onRemoved }), { wrapper }),
      invalidate,
      onRemoved,
    };
  };

  it('waits for all removals, reports partial success, and blocks duplicate submissions', async () => {
    let finish: (() => void) | undefined;
    mocks.invoke.mockImplementation((_command, args) =>
      args.relativePath === 'alpha'
        ? new Promise<void>(resolve => {
            finish = resolve;
          })
        : Promise.reject(new Error('Permission denied')),
    );
    const { result, invalidate, onRemoved } = mountRemoval();
    const a = skill('alpha');
    const b = skill('bravo');
    act(() => {
      result.current.removeSkills([a, b]);
      result.current.removeSkills([a, b]);
    });
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledOnce());
    expect(invalidate).not.toHaveBeenCalled();
    await act(async () => {
      finish?.();
    });
    await waitFor(() => expect(result.current.isRemoving).toBe(false));
    expect(mocks.invoke).toHaveBeenCalledTimes(2);
    expect(onRemoved).toHaveBeenCalledExactlyOnceWith(a);
    expect(mocks.toast.warning).toHaveBeenCalledWith(
      'Deleted 1 of 2 skills',
      expect.objectContaining({
        description: expect.stringContaining('bravo'),
      }),
    );
    expect(invalidate).toHaveBeenCalledOnce();
  });

  it('removes nested skills first and preserves the selected folder containing its own SKILL.md', async () => {
    mocks.invoke.mockResolvedValue(undefined);
    const { result } = mountRemoval();
    act(() =>
      result.current.removeSkills(
        [skill('tools'), skill('tools/child'), skill('tools/child')],
        '/work/demo/tools',
      ),
    );
    await waitFor(() => expect(result.current.isRemoving).toBe(false));
    expect(mocks.invoke.mock.calls).toEqual([
      [
        'remove_skill',
        {
          rootPath: '/work/demo',
          relativePath: 'tools/child',
          preserveDirectory: false,
        },
      ],
      [
        'remove_skill',
        {
          rootPath: '/work/demo',
          relativePath: 'tools',
          preserveDirectory: true,
        },
      ],
    ]);
  });

  it('does not remove a parent directory after a nested skill fails', async () => {
    mocks.invoke.mockRejectedValue(new Error('Permission denied'));
    const { result } = mountRemoval();
    act(() =>
      result.current.removeSkills([skill('tools'), skill('tools/child')]),
    );
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalled());
    expect(mocks.invoke).toHaveBeenCalledOnce();
    expect(mocks.invoke.mock.calls[0][1].relativePath).toBe('tools/child');
  });
});

it('focuses the red outline project removal action and supports Enter without double submission', async () => {
  const root: SkillRoot = {
    id: 'demo',
    path: '/work/demo',
    label: 'demo',
    exists: true,
    kind: 'repository',
    provider: 'repository',
    scopeId: '/work/demo',
    scopeLabel: 'demo',
    scopeKind: 'repository',
  };
  let finish: ((result: boolean) => void) | undefined;
  const remove = vi.fn(
    () =>
      new Promise<boolean>(resolve => {
        finish = resolve;
      }),
  );
  render(
    <RepositorySelector
      roots={[root]}
      selectedRepositoryId='/work/demo'
      isImporting={false}
      removingRepositoryId={null}
      onSelectRepository={vi.fn()}
      onImportRepository={vi.fn()}
      onRemoveRepository={remove}
    />,
  );
  fireEvent.keyDown(screen.getByRole('button', { name: 'Options for demo' }), {
    key: 'ArrowDown',
  });
  fireEvent.click(
    await screen.findByRole('menuitem', { name: 'Remove from Rig…' }),
  );
  const dialog = await screen.findByRole('alertdialog');
  const button = within(dialog).getByRole('button', {
    name: 'Remove from Rig',
  });
  await waitFor(() => expect(document.activeElement).toBe(button));
  expect(button.className).toContain('border-destructive/60');
  fireEvent.keyDown(button, { key: 'Enter' });
  fireEvent.keyDown(button, { key: 'Enter' });
  expect(remove).toHaveBeenCalledExactlyOnceWith(root);
  await act(async () => {
    finish?.(true);
  });
  expect(screen.queryByRole('alertdialog')).toBeNull();
});
