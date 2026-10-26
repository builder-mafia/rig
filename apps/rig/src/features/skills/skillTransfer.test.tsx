import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SkillRoot } from './components/SkillRoot';
import { RepositorySelector } from './components/RepositorySelector';
import {
  SkillTransferContext,
  useSkillTransferController,
} from './SkillTransferContext';
import {
  createSkillTransfer,
  getFolderCopyTarget,
  parseSkillTransfer,
  readSkillTransfer,
  SKILL_TRANSFER_TYPE,
} from './skillTransfer';
import type { Skill, SkillRoot as RootModel } from './types';

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(() => 'transfer-toast'),
  },
}));
vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }));
vi.mock('@allin/ui', async importOriginal => ({
  ...(await importOriginal<object>()),
  toast: mocks.toast,
}));
vi.mock('./useFetchSkills', () => ({
  useFetchSkills: (visible: RootModel[]) => ({
    skills: skills.filter(skill =>
      visible.some(root => root.path === skill.rootPath),
    ),
    isLoading: false,
    error: null,
  }),
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

class TransferData {
  values = new Map<string, string>();
  effectAllowed = 'uninitialized';
  dropEffect = 'none';
  get types() {
    return [...this.values.keys()];
  }
  setData(type: string, value: string) {
    this.values.set(type, value);
  }
  getData(type: string) {
    return this.values.get(type) ?? '';
  }
  clearData() {
    this.values.clear();
  }
}
const clipboard = () => new TransferData() as unknown as DataTransfer;
const clipboardEvent = (
  target: Element,
  type: 'copy' | 'paste',
  data: DataTransfer,
) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', { value: data });
  fireEvent(target, event);
  return event;
};

const Harness = () => {
  const [scope, setScope] = useState('global');
  const transfer = useSkillTransferController(roots, scope);
  return (
    <SkillTransferContext.Provider value={transfer}>
      <RepositorySelector
        roots={roots}
        selectedRepositoryId={scope}
        isImporting={false}
        onSelectRepository={id => {
          transfer.clearFolder();
          setScope(id);
        }}
        onImportRepository={() => {}}
        onRemoveRepository={async () => true}
        removingRepositoryId={null}
      />
      <SkillRoot
        key={scope}
        roots={
          scope === 'global'
            ? roots
            : roots.filter(root => root.scopeId === scope)
        }
        hiddenSkillSourceIds={new Set()}
      />
      <input aria-label='Editing text' />
    </SkillTransferContext.Provider>
  );
};
const mount = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Harness />
    </QueryClientProvider>,
  );
const row = (name: string) =>
  screen.getByRole('button', { name: `${name} ${name} instructions` });
const selectAndCopy = () => {
  fireEvent.click(row('review'));
  const data = clipboard();
  const event = clipboardEvent(row('review'), 'copy', data);
  return { data, event };
};
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mocks.invoke.mockImplementation(async (_command, args) => ({
    path: `${args.targetRootPath}/${args.targetRelativeFolder}/${args.sourceRelativePath}`,
  }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.getSelection()?.removeAllRanges();
});

describe('skill transfer format', () => {
  it('uses a versioned custom type and never accepts matching JSON from plain text', () => {
    const payload = createSkillTransfer(skills)!;
    expect(payload).toEqual({
      type: 'rig.skills',
      version: 1,
      skills: skills.map(({ rootPath, relativePath, name }) => ({
        rootPath,
        relativePath,
        name,
      })),
    });
    const data = clipboard();
    data.setData('text/plain', JSON.stringify(payload));
    expect(readSkillTransfer(data)).toBeNull();
    data.setData(SKILL_TRANSFER_TYPE, JSON.stringify(payload));
    expect(readSkillTransfer(data)).toEqual(payload);
  });
  it('rejects unsupported versions, malformed references, path escapes and oversized batches', () => {
    const payload = createSkillTransfer(skills)!;
    for (const changed of [
      { ...payload, version: 2 },
      { ...payload, skills: [] },
      {
        ...payload,
        skills: [{ ...payload.skills[0], relativePath: '../secret' }],
      },
      {
        ...payload,
        skills: [{ ...payload.skills[0], relativePath: '/absolute' }],
      },
      {
        ...payload,
        skills: [{ ...payload.skills[0], rootPath: 'relative-root' }],
      },
      { ...payload, skills: Array(501).fill(payload.skills[0]) },
    ])
      expect(parseSkillTransfer(JSON.stringify(changed))).toBeNull();
    expect(parseSkillTransfer('broken JSON')).toBeNull();
    expect(parseSkillTransfer('x'.repeat(1_000_001))).toBeNull();
    expect(
      createSkillTransfer([{ ...skills[0], isArchived: true }]),
    ).toBeNull();
    expect(createSkillTransfer([skills[0], skills[0]])?.skills).toHaveLength(1);
  });
  it('resolves nested folders with root boundaries and rejects unrelated paths', () => {
    expect(getFolderCopyTarget(roots, '/demo/skills/nested')).toEqual({
      rootPath: '/demo/skills',
      relativeFolder: 'nested',
      path: '/demo/skills/nested',
    });
    expect(getFolderCopyTarget(roots, '/demo/skills-other')).toBeNull();
    expect(getFolderCopyTarget(roots, '/demo/skills/../outside')).toBeNull();
  });
});

describe('copy, paste and drag between roots', () => {
  it('copies selected skills into the OS event payload and pastes after switching to an empty project', async () => {
    mount();
    const { data, event } = selectAndCopy();
    expect(event.defaultPrevented).toBe(true);
    expect(data.types).toContain(SKILL_TRANSFER_TYPE);
    expect(mocks.toast.success).toHaveBeenCalledWith(
      'Skill copied to clipboard',
      expect.any(Object),
    );
    const project = screen.getByRole('button', { name: 'project' });
    fireEvent.click(project);
    clipboardEvent(project, 'paste', data);
    await waitFor(() =>
      expect(mocks.invoke).toHaveBeenCalledWith('copy_skill_to_folder', {
        sourceRootPath: '/demo/skills',
        sourceRelativePath: 'review',
        targetRootPath: '/work/project',
        targetRelativeFolder: '.agents/skills',
      }),
    );
    await waitFor(() =>
      expect(mocks.toast.success).toHaveBeenCalledWith(
        'Skill copied',
        expect.objectContaining({ id: 'transfer-toast' }),
      ),
    );
  });
  it('pastes into a selected folder and requires a destination in All skills', async () => {
    mount();
    const { data } = selectAndCopy();
    clipboardEvent(document.body, 'paste', data);
    expect(mocks.invoke).not.toHaveBeenCalled();
    expect(mocks.toast.info).toHaveBeenCalled();
    const folder = document.querySelector(
      '[data-skill-drop-target="/demo/skills"]',
    )!;
    fireEvent.click(folder.querySelector('button')!);
    clipboardEvent(folder, 'paste', data);
    await waitFor(() =>
      expect(mocks.invoke).toHaveBeenCalledWith(
        'copy_skill_to_folder',
        expect.objectContaining({
          targetRootPath: '/demo/skills',
          targetRelativeFolder: '',
        }),
      ),
    );
  });
  it('leaves text editing, text selection, and ordinary clipboard data alone', () => {
    mount();
    const { data } = selectAndCopy();
    const input = screen.getByRole('textbox', { name: 'Editing text' });
    expect(clipboardEvent(input, 'paste', data).defaultPrevented).toBe(false);
    expect(clipboardEvent(input, 'copy', clipboard()).defaultPrevented).toBe(
      false,
    );
    const plain = clipboard();
    plain.setData('text/plain', data.getData(SKILL_TRANSFER_TYPE));
    expect(clipboardEvent(document.body, 'paste', plain).defaultPrevented).toBe(
      false,
    );
    const range = document.createRange();
    range.selectNodeContents(
      screen.getByText('review instructions', { selector: 'p' }),
    );
    window.getSelection()!.addRange(range);
    expect(
      clipboardEvent(document.body, 'copy', clipboard()).defaultPrevented,
    ).toBe(false);
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it('rejects invalid custom data without invoking file operations', () => {
    mount();
    const data = clipboard();
    data.setData(SKILL_TRANSFER_TYPE, '{invalid');
    expect(clipboardEvent(document.body, 'paste', data).defaultPrevented).toBe(
      true,
    );
    expect(mocks.toast.error).toHaveBeenCalledWith(
      'This Rig clipboard data is invalid or unsupported.',
    );
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it('drags a multi-selection with the same format and copies once per skill', async () => {
    mount();
    fireEvent.click(row('review'));
    fireEvent.click(row('testing'), { metaKey: true });
    const data = clipboard();
    fireEvent.dragStart(row('review'), { dataTransfer: data });
    expect(readSkillTransfer(data)?.skills).toHaveLength(2);
    expect(data.effectAllowed).toBe('copy');
    const destination = document.querySelector(
      '[data-skill-drop-target="/work/project/.agents/skills"]',
    )!;
    fireEvent.dragOver(destination, { dataTransfer: data });
    expect(data.dropEffect).toBe('copy');
    fireEvent.drop(destination, { dataTransfer: data });
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledTimes(2));
    expect(
      mocks.invoke.mock.calls.map(([, args]) => args.sourceRelativePath),
    ).toEqual(['review', 'testing']);
    await waitFor(() =>
      expect(mocks.toast.success).toHaveBeenCalledWith(
        'Copied 2 skills',
        expect.any(Object),
      ),
    );
  });
  it('reports partial copies and blocks repeated pastes while a copy is pending', async () => {
    mount();
    const data = clipboard();
    data.setData(
      SKILL_TRANSFER_TYPE,
      JSON.stringify(createSkillTransfer(skills)),
    );
    const project = screen.getByRole('button', { name: 'project' });
    fireEvent.click(project);
    let resolve!: (result: { path: string }) => void;
    mocks.invoke
      .mockReturnValueOnce(
        new Promise(done => {
          resolve = done;
        }),
      )
      .mockRejectedValueOnce(new Error('source deleted'));
    clipboardEvent(project, 'paste', data);
    clipboardEvent(project, 'paste', data);
    expect(mocks.invoke).toHaveBeenCalledTimes(1);
    await act(async () =>
      resolve({ path: '/work/project/.agents/skills/review' }),
    );
    await waitFor(() =>
      expect(mocks.toast.warning).toHaveBeenCalledWith(
        'Copied 1 of 2 skills',
        expect.objectContaining({
          description: expect.stringContaining('testing'),
        }),
      ),
    );
    expect(mocks.invoke).toHaveBeenCalledTimes(2);
  });
});
