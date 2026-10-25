import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SkillList, type SkillListProps } from './components/SkillList';
import { buildSkillTree, getExpandedSkills } from './skillTree';
import type { Skill } from './types';
import {
  getHiddenSkillKey,
  HIDDEN_SKILLS_KEY,
  parseHiddenSkills,
  useHiddenSkills,
} from './useHiddenSkills';
import { getSkillIdentity } from './useRemoveSkill';

const invoke = vi.hoisted(() => vi.fn());
vi.mock('@tauri-apps/api/core', () => ({ invoke }));
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
