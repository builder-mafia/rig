import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SkillList, type SkillListProps } from './components/SkillList';
import { SkillRoot } from './components/SkillRoot';
import { buildSkillTree, getExpandedSkills } from './skillTree';
import type { Skill } from './types';
import {
  getHiddenSkillKey,
  getHidingFolder,
  HIDDEN_FOLDERS_KEY,
  HIDDEN_SKILLS_KEY,
  parseHiddenSkills,
  useHiddenSkills,
} from './useHiddenSkills';
import { getSkillIdentity } from './useRemoveSkill';

const invoke = vi.hoisted(() => vi.fn());
const fetched = vi.hoisted(() => ({ skills: [] as Skill[] }));
vi.mock('@tauri-apps/api/core', () => ({ invoke }));
vi.mock('./useFetchSkills', () => ({
  useFetchSkills: () => ({
    skills: fetched.skills,
    isLoading: false,
    error: null,
  }),
}));
vi.mock('./useFetchArchivedSkills', () => ({
  useFetchArchivedSkills: () => ({ archivedSkills: [], error: null }),
}));
const skill = (name: string, overrides: Partial<Skill> = {}): Skill => ({
  id: name,
  name,
  rootPath: '/Users/test/.agents/skills',
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
  rootId: 'agents',
  rootLabel: 'Codex',
  ...overrides,
});
const project = (name: string, relativePath: string) =>
  skill(name, {
    rootPath: '/work/rig',
    relativePath,
    scopeKind: 'repository',
    scopeId: '/work/rig',
    scopeLabel: 'rig',
    provider: 'repository',
  });

beforeEach(() => {
  window.localStorage.clear();
  invoke.mockReset();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('folder library', () => {
  it('orders global skills first and includes nested project folders without merging same-name skills', () => {
    const global = skill('review');
    const nested = project('review', 'packages/web/.agents/skills/review');
    const root = project('root', '');
    const folders = buildSkillTree([nested, root, global]);
    expect(folders.map(folder => folder.label)).toEqual(['Global', 'rig']);
    expect(folders[0].folders[0].label).toBe('~/.agents/skills');
    expect(folders[1].skills).toEqual([root]);
    expect(folders[1].folders[0].label).toBe('packages');
    expect(folders[1].count).toBe(2);
    expect(getExpandedSkills(folders, new Set())).toEqual([
      global,
      root,
      nested,
    ]);
    expect(getExpandedSkills(folders, new Set(['/work/rig']))).toEqual([
      global,
    ]);
  });

  it('normalizes Windows paths and keeps identically named projects separate', () => {
    const folders = buildSkillTree(
      [
        skill('a', {
          rootPath: 'C:\\Users\\test\\.agents\\skills',
          relativePath: 'tools\\a',
        }),
        project('b', 'b'),
        project('c', 'c'),
        project('d', 'd'),
      ].map(item =>
        item.name === 'd'
          ? { ...item, rootPath: '/other/rig', scopeId: '/other/rig' }
          : item,
      ),
    );
    expect(folders).toHaveLength(3);
    expect(folders[0].folders[0].folders[0].label).toBe('tools');
    expect(getExpandedSkills(folders, new Set())).toHaveLength(4);
  });
});

describe('Rig-only visibility', () => {
  it('persists folder rules for existing and future descendants without matching sibling prefixes', () => {
    const hook = renderHook(useHiddenSkills);
    const individuallyHidden = project('alpha', 'packages/alpha');
    act(() => {
      hook.result.current.setSkillsHidden([individuallyHidden], true);
      hook.result.current.setFolderHidden('/work/rig/packages/', true);
    });
    hook.unmount();
    const reopened = renderHook(useHiddenSkills);
    const folders = reopened.result.current.hiddenFolderPaths;
    expect(
      getHidingFolder('/work/rig/packages/new/nested/SKILL.md', folders),
    ).toBe('/work/rig/packages');
    expect(
      getHidingFolder('/work/rig/packages-extra/alpha/SKILL.md', folders),
    ).toBeUndefined();
    expect(
      getHidingFolder('/other/rig/packages/alpha/SKILL.md', folders),
    ).toBeUndefined();
    act(() => {
      reopened.result.current.setFolderHidden('/work/rig/packages', false);
    });
    expect(reopened.result.current.hiddenFolderPaths.size).toBe(0);
    expect(
      reopened.result.current.hiddenPaths.has(
        getHiddenSkillKey(individuallyHidden),
      ),
    ).toBe(true);
    expect(
      JSON.parse(localStorage.getItem(HIDDEN_FOLDERS_KEY) ?? 'null'),
    ).toEqual([]);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('retains nested folder preferences when their parent is shown and handles failed writes', () => {
    const hook = renderHook(useHiddenSkills);
    act(() => {
      hook.result.current.setFolderHidden(
        'C:\\work\\rig\\tools\\private',
        true,
      );
      hook.result.current.setFolderHidden('C:\\work\\rig\\tools', true);
    });
    expect(
      getHidingFolder(
        'C:\\work\\rig\\tools\\private\\SKILL.md',
        hook.result.current.hiddenFolderPaths,
      ),
    ).toBe('C:/work/rig/tools');
    act(() => {
      hook.result.current.setFolderHidden('C:/work/rig/tools', false);
    });
    expect(
      getHidingFolder(
        'C:/work/rig/tools/private/SKILL.md',
        hook.result.current.hiddenFolderPaths,
      ),
    ).toBe('C:/work/rig/tools/private');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage full');
    });
    act(() => {
      expect(
        hook.result.current.setFolderHidden('C:/work/rig/tools/private', false),
      ).toBe(false);
    });
    expect(hook.result.current.hiddenFolderPaths.size).toBe(1);
  });

  it('persists hiding by full file path, survives a remount and never invokes a filesystem command', () => {
    const first = skill('same');
    const second = project('same', '.agents/skills/same');
    const original = JSON.stringify([first, second]);
    const hook = renderHook(useHiddenSkills);
    act(() => {
      hook.result.current.setSkillsHidden([first], true);
    });
    expect(hook.result.current.hiddenPaths.has(getHiddenSkillKey(first))).toBe(
      true,
    );
    expect(hook.result.current.hiddenPaths.has(getHiddenSkillKey(second))).toBe(
      false,
    );
    hook.unmount();
    const reopened = renderHook(useHiddenSkills);
    expect(
      reopened.result.current.hiddenPaths.has(getHiddenSkillKey(first)),
    ).toBe(true);
    act(() => {
      reopened.result.current.setSkillsHidden([first], false);
    });
    expect(
      JSON.parse(window.localStorage.getItem(HIDDEN_SKILLS_KEY) ?? 'null'),
    ).toEqual([]);
    expect(JSON.stringify([first, second])).toBe(original);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('preserves consecutive changes and leaves state unchanged when persistence fails', () => {
    const first = skill('first');
    const second = skill('second');
    const hook = renderHook(useHiddenSkills);
    act(() => {
      hook.result.current.setSkillsHidden([first], true);
      hook.result.current.setSkillsHidden([second], true);
    });
    expect(hook.result.current.hiddenPaths.size).toBe(2);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage full');
    });
    act(() => {
      expect(hook.result.current.setSkillsHidden([first], false)).toBe(false);
    });
    expect(hook.result.current.hiddenPaths.size).toBe(2);
    expect(parseHiddenSkills('{bad json')).toEqual([]);
    expect(parseHiddenSkills('[null,12,"/a","/a"]')).toEqual(['/a']);
  });
});

describe('compact skill list', () => {
  const renderList = (skills: Skill[]) => {
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
    };
    return { props, ...render(<SkillList {...props} />) };
  };

  it('lets a filtered folder hide its full path and provides a restore action in Hidden', () => {
    const a = project('alpha', 'packages/web/alpha');
    const b = project('beta', 'packages/web/beta');
    const { props, rerender } = renderList([a, b]);
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'alpha' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Hide folder from Rig: /work/rig/packages/web',
      }),
    );
    expect(props.onFolderVisibilityChange).toHaveBeenCalledWith(
      '/work/rig/packages/web',
      true,
    );
    rerender(
      <SkillList
        {...props}
        skills={[]}
        hiddenSkills={[a, b]}
        hiddenFolderPaths={new Set(['/work/rig/packages'])}
        showingHidden
      />,
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Show parent folder in Rig: /work/rig/packages',
      }),
    );
    expect(props.onFolderVisibilityChange).toHaveBeenLastCalledWith(
      '/work/rig/packages',
      false,
    );
  });

  it('opens matching collapsed folders during search and restores their collapsed state when cleared', () => {
    renderList([skill('alpha'), project('nested', 'packages/web/nested')]);
    fireEvent.click(screen.getByRole('button', { name: 'rig 1' }));
    expect(
      screen.queryByRole('button', { name: 'nested nested instructions' }),
    ).toBeNull();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search skills' }), {
      target: { value: 'nested' },
    });
    expect(
      screen.getByRole('button', { name: 'nested nested instructions' }),
    ).toBeTruthy();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
    expect(
      screen.queryByRole('button', { name: 'nested nested instructions' }),
    ).toBeNull();
    expect(screen.queryByText('Updates')).toBeNull();
    expect(screen.queryByText('Recent · 7d')).toBeNull();
    expect(screen.queryByText('Codex')).toBeNull();
  });

  it('selects ranges in displayed folder order, excluding collapsed folders', () => {
    const a = skill('alpha');
    const hiddenByCollapse = project('beta', 'folder/beta');
    const c = project('gamma', 'gamma');
    const { props } = renderList([hiddenByCollapse, c, a]);
    fireEvent.click(screen.getByRole('button', { name: 'folder 1' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'alpha alpha instructions' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'gamma gamma instructions' }),
      { shiftKey: true },
    );
    expect(props.onSelectionChange).toHaveBeenLastCalledWith([a, c], c);
    expect(getSkillIdentity(a)).not.toBe(getSkillIdentity(c));
  });
});

describe('folder visibility in the library', () => {
  it('moves an entire subtree to Hidden and restores it while preserving individually hidden skills', () => {
    fetched.skills = [
      project('alpha', 'packages/web/alpha'),
      project('beta', 'packages/web/beta'),
      project('gamma', 'packages-other/gamma'),
    ];
    localStorage.setItem(
      HIDDEN_SKILLS_KEY,
      JSON.stringify([getHiddenSkillKey(fetched.skills[1])]),
    );
    render(
      <QueryClientProvider client={new QueryClient()}>
        <SkillRoot roots={[]} hiddenSkillSourceIds={new Set()} />
      </QueryClientProvider>,
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Hide folder from Rig: /work/rig/packages',
      }),
    );
    expect(
      screen.queryByRole('button', { name: 'alpha alpha instructions' }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: 'gamma gamma instructions' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Hidden skills (2)' }));
    expect(
      screen.getByRole('button', { name: 'alpha alpha instructions' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'beta beta instructions' }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Show folder in Rig: /work/rig/packages',
      }),
    );
    expect(
      screen.queryByRole('button', { name: 'alpha alpha instructions' }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: 'beta beta instructions' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Back to skills' }));
    expect(
      screen.getByRole('button', { name: 'alpha alpha instructions' }),
    ).toBeTruthy();
    expect(invoke).not.toHaveBeenCalled();
  });
});
