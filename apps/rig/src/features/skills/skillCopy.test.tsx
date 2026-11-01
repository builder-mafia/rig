import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CopySkillsDialog } from './components/CopySkillsDialog';
import { SkillRoot } from './components/SkillRoot';
import type { Skill, SkillRoot as RootModel } from './types';

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  open: vi.fn(),
  writeText: vi.fn(),
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(() => 'copy-toast'),
  },
}));
vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }));
vi.mock('@tauri-apps/plugin-dialog', () => ({ open: mocks.open }));
vi.mock('@allin/ui', async importOriginal => ({
  ...(await importOriginal<object>()),
  toast: mocks.toast,
}));
vi.mock('./useFetchSkills', () => ({
  useFetchSkills: () => ({ skills, isLoading: false, error: null }),
}));
vi.mock('./useFetchArchivedSkills', () => ({
  useFetchArchivedSkills: () => ({ archivedSkills: [], error: null }),
}));

const roots: RootModel[] = [
  {
    id: 'global-agents',
    path: '/demo/skills',
    label: 'Codex',
    exists: true,
    kind: 'default',
    provider: 'agents',
    scopeId: 'global',
    scopeLabel: 'Global',
    scopeKind: 'global',
  },
  {
    id: 'project',
    path: '/work/project',
    label: 'project',
    exists: true,
    kind: 'repository',
    provider: 'repository',
    scopeId: '/work/project',
    scopeLabel: 'project',
    scopeKind: 'repository',
  },
];
const skills: Skill[] = ['review', 'testing'].map(name => ({
  id: name,
  name,
  rootPath: roots[0].path,
  relativePath: name,
  content: `# ${name}`,
  description: `${name} instructions`,
  isValid: true,
  validationError: null,
  updatedAt: null,
  isArchived: false,
  provider: 'agents',
  scopeId: 'global',
  scopeLabel: 'Global',
  scopeKind: 'global',
  rootId: roots[0].id,
  rootLabel: 'Codex',
}));

const copyCalls = () =>
  mocks.invoke.mock.calls.filter(
    ([command]) => command === 'copy_skill_to_folder',
  );
const row = (name: string) =>
  screen.getByRole('button', { name: `${name} ${name} instructions` });
const mount = (children: React.ReactNode) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  return {
    ...render(
      <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    ),
    invalidate,
  };
};
const defaultInvoke = async (
  command: string,
  args?: Record<string, string>,
) => {
  if (command === 'list_skill_roots') return roots;
  if (command === 'list_skill_editors') return [];
  if (command === 'read_skill_document')
    return { content: '# Review', revision: 'test' };
  if (command === 'copy_skill_to_folder')
    return {
      path: `${args!.targetRootPath}/${args!.targetRelativeFolder}/${args!.sourceRelativePath}`,
    };
};
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mocks.invoke.mockImplementation(defaultInvoke);
  mocks.open.mockResolvedValue(null);
  mocks.writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: mocks.writeText },
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('copy destination picker', () => {
  it('lists unique available projects before Custom and copies the selected batch to project skills', async () => {
    mocks.invoke.mockImplementation(async (command, args) =>
      command === 'list_skill_roots'
        ? [
            ...roots,
            { ...roots[1], id: 'duplicate' },
            { ...roots[1], id: 'missing', scopeId: '/missing', exists: false },
          ]
        : defaultInvoke(command, args),
    );
    const onClose = vi.fn();
    const { invalidate } = mount(
      <CopySkillsDialog skills={skills} onClose={onClose} />,
    );
    const project = await screen.findByRole('button', {
      name: 'project /work/project/.agents/skills',
    });
    expect(
      screen.getAllByRole('button', { name: /project \/work/ }),
    ).toHaveLength(1);
    expect(
      project.compareDocumentPosition(
        screen.getByRole('button', { name: 'Custom' }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    fireEvent.click(project);
    expect(screen.getByText('Copy 2 skills to this folder?')).toBeTruthy();
    expect(screen.getByText('/work/project/.agents/skills')).toBeTruthy();
    expect(copyCalls()).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(copyCalls().map(([, args]) => args)).toEqual(
      skills.map(skill => ({
        sourceRootPath: skill.rootPath,
        sourceRelativePath: skill.relativePath,
        targetRootPath: '/work/project',
        targetRelativeFolder: '.agents/skills',
      })),
    );
    expect(mocks.open).not.toHaveBeenCalled();
    expect(mocks.writeText).not.toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['skills'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['skill-roots'] });
    expect(mocks.toast.success).toHaveBeenCalledWith(
      'Copied 2 skills',
      expect.objectContaining({ position: 'top-center' }),
    );
  });

  it('confirms a custom folder and leaves picker cancellation untouched', async () => {
    const onClose = vi.fn();
    mount(<CopySkillsDialog skills={[skills[0]]} onClose={onClose} />);
    const custom = screen.getByRole('button', { name: 'Custom' });
    fireEvent.click(custom);
    await waitFor(() =>
      expect((custom as HTMLButtonElement).disabled).toBe(false),
    );
    expect(mocks.open).toHaveBeenCalledWith({
      title: 'Choose a folder to copy skills into',
      directory: true,
      multiple: false,
    });
    expect(copyCalls()).toHaveLength(0);
    expect(onClose).not.toHaveBeenCalled();
    mocks.open.mockResolvedValue('/custom/My Skills');
    fireEvent.click(custom);
    expect(
      await screen.findByText('Copy “review” to this folder?'),
    ).toBeTruthy();
    expect(screen.getByText('/custom/My Skills')).toBeTruthy();
    expect(copyCalls()).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(copyCalls()[0][1]).toEqual({
      sourceRootPath: '/demo/skills',
      sourceRelativePath: 'review',
      targetRootPath: '/custom/My Skills',
      targetRelativeFolder: '',
    });
  });

  it('can go back and confirm a different destination without copying to the first', async () => {
    const onClose = vi.fn();
    mount(<CopySkillsDialog skills={[skills[0]]} onClose={onClose} />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'project /work/project/.agents/skills',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(copyCalls()).toHaveLength(0);
    expect(onClose).not.toHaveBeenCalled();
    mocks.open.mockResolvedValue('/changed/destination');
    fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
    await screen.findByText('/changed/destination');
    expect(copyCalls()).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(copyCalls()).toHaveLength(1);
    expect(copyCalls()[0][1]).toMatchObject({
      targetRootPath: '/changed/destination',
      targetRelativeFolder: '',
    });
  });

  it.each(['Cancel', 'Escape'])(
    'can dismiss confirmation with %s without copying',
    async action => {
      const onClose = vi.fn();
      mount(<CopySkillsDialog skills={skills} onClose={onClose} />);
      fireEvent.click(
        await screen.findByRole('button', {
          name: 'project /work/project/.agents/skills',
        }),
      );
      expect(screen.getByText('Copy 2 skills to this folder?')).toBeTruthy();
      if (action === 'Cancel')
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      else fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(onClose).toHaveBeenCalledOnce();
      expect(copyCalls()).toHaveLength(0);
      expect(mocks.toast.loading).not.toHaveBeenCalled();
    },
  );

  it('keeps Custom usable when project discovery fails', async () => {
    mocks.invoke.mockImplementation(async command => {
      if (command === 'list_skill_roots') throw new Error('Offline');
    });
    mount(<CopySkillsDialog skills={skills} onClose={vi.fn()} />);
    expect(
      await screen.findByText(
        'Couldn’t load projects. Choose Custom to select a folder.',
      ),
    ).toBeTruthy();
    mocks.open.mockRejectedValueOnce(new Error('Dialog unavailable'));
    fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
    await waitFor(() =>
      expect(mocks.toast.error).toHaveBeenCalledWith(
        'Couldn’t open the folder picker.',
        expect.any(Object),
      ),
    );
    expect(copyCalls()).toHaveLength(0);
  });

  it('retries only failed skills after a partial success', async () => {
    let fail = true;
    mocks.invoke.mockImplementation(async (command, args) => {
      if (
        command === 'copy_skill_to_folder' &&
        args.sourceRelativePath === 'testing' &&
        fail
      )
        throw new Error('Read only');
      return defaultInvoke(command, args);
    });
    const onClose = vi.fn();
    mount(<CopySkillsDialog skills={skills} onClose={onClose} />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'project /work/project/.agents/skills',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await screen.findByText('Copy “testing” to this folder?');
    expect(mocks.toast.warning).toHaveBeenCalledWith(
      'Copied 1 of 2 skills',
      expect.any(Object),
    );
    expect(onClose).not.toHaveBeenCalled();
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(copyCalls().map(([, args]) => args.sourceRelativePath)).toEqual([
      'review',
      'testing',
      'testing',
    ]);
  });

  it('prevents repeated copies and dismissal while copying', async () => {
    let finish!: (value: { path: string }) => void;
    mocks.invoke.mockImplementation((command, args) =>
      command === 'copy_skill_to_folder'
        ? new Promise(resolve => {
            finish = resolve;
          })
        : defaultInvoke(command, args),
    );
    const onClose = vi.fn();
    mount(<CopySkillsDialog skills={[skills[0]]} onClose={onClose} />);
    const project = await screen.findByRole('button', {
      name: 'project /work/project/.agents/skills',
    });
    fireEvent.click(project);
    const confirm = screen.getByRole('button', { name: 'Copy' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(copyCalls()).toHaveLength(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    await act(async () =>
      finish({ path: '/work/project/.agents/skills/review' }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('left panel actions', () => {
  it('opens Copy from the concise context menu with multiple selected skills', async () => {
    mount(<SkillRoot roots={roots} hiddenSkillSourceIds={new Set()} />);
    fireEvent.click(row('review'));
    fireEvent.click(row('testing'), { metaKey: true });
    fireEvent.contextMenu(row('review'));
    expect(screen.getByRole('menuitem', { name: 'Hide' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Share' })).toBeTruthy();
    expect(
      screen.queryByRole('menuitem', { name: 'Copy instructions' }),
    ).toBeNull();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(
      await screen.findByText('Choose a destination for 2 skills.'),
    ).toBeTruthy();
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'project /work/project/.agents/skills',
      }),
    );
    expect(copyCalls()).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(copyCalls()).toHaveLength(2));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(mocks.writeText).not.toHaveBeenCalled();
  });

  it('shares immediately as text with a toast', async () => {
    mount(<SkillRoot roots={roots} hiddenSkillSourceIds={new Set()} />);
    fireEvent.contextMenu(row('review'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Share' }));
    await waitFor(() => expect(mocks.writeText).toHaveBeenCalledOnce());
    expect(mocks.writeText).toHaveBeenCalledWith(
      expect.stringContaining('review/SKILL.md'),
    );
    expect(mocks.toast.success).toHaveBeenCalledWith('Copied to clipboard', {
      position: 'top-center',
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not intercept clipboard events or accept the retired drag payload', async () => {
    const { container } = mount(
      <SkillRoot roots={roots} hiddenSkillSourceIds={new Set()} />,
    );
    fireEvent.click(row('review'));
    const data = {
      types: ['application/vnd.rig.skills+json'],
      getData: vi.fn(() =>
        JSON.stringify({ type: 'rig.skills', version: 1, skills }),
      ),
      setData: vi.fn(),
      clearData: vi.fn(),
    };
    for (const type of ['copy', 'paste']) {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'clipboardData', { value: data });
      fireEvent(row('review'), event);
      expect(event.defaultPrevented).toBe(false);
    }
    expect(container.querySelector('[draggable="true"]')).toBeNull();
    fireEvent.drop(row('testing'), { dataTransfer: data });
    await act(async () => {});
    expect(data.setData).not.toHaveBeenCalled();
    expect(data.getData).not.toHaveBeenCalled();
    expect(copyCalls()).toHaveLength(0);
  });
});
