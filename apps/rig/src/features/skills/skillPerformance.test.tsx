import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Profiler, type ComponentProps, type ReactNode } from 'react';
import { translate } from '@/lib/translations';
import { SkillList, type SkillListProps } from './components/SkillList';
import {
  getSkillDocumentSession,
  SkillDocumentSession,
} from './skillDocumentSession';
import {
  useSkillDocumentContent,
  useSkillDocumentStatus,
} from './useSkillDocument';
import { useFetchSkills } from './useFetchSkills';
import { useFetchArchivedSkills } from './useFetchArchivedSkills';
import { getSkillIdentity } from './skillIdentity';
import { matchesSkillSearch } from './insights';
import { buildSkillTree, flattenSkillTree } from './skillTree';
import type { Skill, SkillRoot } from './types';

const invoke = vi.hoisted(() => vi.fn());
const rowCommit = vi.hoisted(() => vi.fn());
vi.mock('@tauri-apps/api/core', () => ({ invoke }));
vi.mock('./components/SkillTreeRow', async original => {
  const rows = await original<typeof import('./components/SkillTreeRow')>();
  const { memo, Profiler } = await import('react');
  return {
    ...rows,
    SkillRow: memo(function TrackedRow(
      props: ComponentProps<typeof rows.SkillRow>,
    ) {
      return (
        <Profiler id={props.id} onRender={rowCommit}>
          <rows.SkillRow {...props} />
        </Profiler>
      );
    }),
  };
});
const skill = (id: string, overrides: Partial<Skill> = {}): Skill => ({
  id,
  name: id,
  rootPath: '/work/skills',
  relativePath: id,
  content: 'Body',
  description: 'Instructions',
  isValid: true,
  validationError: null,
  updatedAt: 'original',
  isArchived: false,
  scopeId: 'global',
  scopeLabel: 'Global',
  scopeKind: 'global',
  rootId: 'agents',
  rootLabel: 'Codex',
  provider: 'agents',
  ...overrides,
});
const root: SkillRoot = {
  id: 'agents',
  path: '/work/skills',
  exists: true,
  kind: 'default',
  label: 'Codex',
  provider: 'agents',
  scopeId: 'global',
  scopeLabel: 'Global',
  scopeKind: 'global',
};
const raw = '---\nname: review\ndescription: Instructions\n---\nBody';
const sessions: SkillDocumentSession[] = [];
const wrapper = (client: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
beforeEach(() => {
  invoke.mockReset();
  rowCommit.mockClear();
  invoke.mockImplementation(async (command, args) =>
    command === 'read_skill_document'
      ? { content: raw, revision: 'original' }
      : command === 'save_skill_document'
        ? { content: args.content, revision: 'saved' }
        : [],
  );
});
afterEach(() => {
  cleanup();
  for (const session of sessions.splice(0)) {
    session.composition(true);
    const saved = session.getSnapshot().saved;
    if (saved) session.change(saved.content);
    session.dispose();
  }
});

describe('document rendering and lifetime', () => {
  it('updates only the saved row with canonical metadata and does not rescan roots', async () => {
    const client = new QueryClient();
    const first = skill('review'),
      sibling = skill('sibling'),
      other = skill('other', { rootPath: '/other' });
    const key = ['skills', root.id, root.path, true];
    client.setQueryData(key, [first, sibling]);
    const aliasKey = ['skills', 'ancestor', '/work', true];
    client.setQueryData(aliasKey, [
      skill('alias', { rootPath: '/work', relativePath: 'skills/review' }),
    ]);
    client.setQueryData(['skills', 'other', '/other', true], [other]);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const summary = {
      name: 'Renamed',
      description: 'New description',
      content: '# New body',
      isValid: true,
      validationError: null,
      updatedAt: 'saved-time',
    };
    invoke.mockImplementation(async (command, args) =>
      command === 'read_skill_document'
        ? { content: raw, revision: 'original' }
        : { content: args.content, revision: 'saved', summary },
    );
    const session = new SkillDocumentSession(
      client,
      root.path,
      'review',
      translate('en'),
    );
    sessions.push(session);
    await session.load();
    session.change(
      '---\nname: Renamed\ndescription: New description\n---\n# New body',
    );
    await session.save();
    const rows = client.getQueryData<Skill[]>(key)!;
    expect(rows[0]).toMatchObject(summary);
    expect(rows[1]).toBe(sibling);
    expect(client.getQueryData<Skill[]>(aliasKey)![0]).toMatchObject(summary);
    expect(
      client.getQueryData<Skill[]>(['skills', 'other', '/other', true])![0],
    ).toBe(other);
    expect(invalidate).not.toHaveBeenCalled();
    const calls = invoke.mock.calls.length;
    await session.load('saved-time');
    expect(invoke.mock.calls.length).toBe(calls);
  });

  it('keeps save-status consumers idle while an already-dirty body changes', async () => {
    const session = new SkillDocumentSession(
      new QueryClient(),
      root.path,
      'review',
      translate('en'),
    );
    sessions.push(session);
    await session.load();
    const bodyCommits = vi.fn(),
      statusCommits = vi.fn();
    function Body() {
      return <pre>{useSkillDocumentContent(session)}</pre>;
    }
    function Status() {
      return <span>{String(useSkillDocumentStatus(session).dirty)}</span>;
    }
    render(
      <>
        <Profiler id='body' onRender={bodyCommits}>
          <Body />
        </Profiler>
        <Profiler id='status' onRender={statusCommits}>
          <Status />
        </Profiler>
      </>,
    );
    act(() => session.change(raw + '1'));
    const afterFirst = {
      body: bodyCommits.mock.calls.length,
      status: statusCommits.mock.calls.length,
    };
    act(() => session.change(raw + '12'));
    act(() => session.change(raw + '123'));
    expect(bodyCommits).toHaveBeenCalledTimes(afterFirst.body + 2);
    expect(statusCommits).toHaveBeenCalledTimes(afterFirst.status);
  });

  it('does not notify subscribers when an unchanged file is refreshed', async () => {
    const session = new SkillDocumentSession(
      new QueryClient(),
      root.path,
      'review',
      translate('en'),
    );
    sessions.push(session);
    await session.load();
    const notify = vi.fn();
    const unsubscribe = session.subscribe(notify);
    await session.load();
    await session.load();
    expect(notify).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('evicts unused clean documents while preserving unsaved drafts', async () => {
    const client = new QueryClient();
    const clean = getSkillDocumentSession(
      client,
      skill('clean'),
      translate('en'),
    );
    const draft = getSkillDocumentSession(
      client,
      skill('draft'),
      translate('en'),
    );
    sessions.push(clean, draft);
    await clean.load();
    await draft.load();
    draft.composition(true);
    draft.change(raw + ' unsaved');
    for (let i = 0; i < 30; i++) {
      const next = getSkillDocumentSession(
        client,
        skill(`visited-${i}`),
        translate('en'),
      );
      await next.load();
    }
    expect(
      getSkillDocumentSession(client, skill('clean'), translate('en')),
    ).not.toBe(clean);
    expect(
      getSkillDocumentSession(client, skill('draft'), translate('en')),
    ).toBe(draft);
    expect(draft.getContentSnapshot()).toBe(raw + ' unsaved');
  });

  it('releases an oversized clean document after its last subscriber leaves', async () => {
    const client = new QueryClient();
    invoke.mockResolvedValue({
      content: 'x'.repeat(1_100_000),
      revision: 'large',
    });
    const document = getSkillDocumentSession(
      client,
      skill('large'),
      translate('en'),
    );
    const unsubscribe = document.subscribe(() => {});
    sessions.push(document);
    await document.load();
    expect(
      getSkillDocumentSession(client, skill('large'), translate('en')),
    ).toBe(document);
    unsubscribe();
    expect(
      getSkillDocumentSession(client, skill('large'), translate('en')),
    ).not.toBe(document);
  });
});

describe('stable library results', () => {
  it('keeps overlapping root branches separate with unique flat-row identities', () => {
    const parent = skill('review', { relativePath: 'nested/review' });
    const nested = skill('review', { rootPath: '/work/skills/nested' });
    const tree = buildSkillTree([parent, nested]);
    expect(tree[0].count).toBe(2);
    expect(tree[0].folders).toHaveLength(2);
    expect(tree[0].folders.map(folder => folder.count)).toEqual([1, 1]);
    const rows = flattenSkillTree(tree, new Set());
    expect(new Set(rows.map(row => `${row.kind}:${row.id}`)).size).toBe(
      rows.length,
    );
  });
  it('preserves combined arrays and archive rows across unrelated renders', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const roots = [root];
    invoke.mockImplementation(async command => [
      skill(command === 'list_skills' ? 'active' : 'archived'),
    ]);
    const hook = renderHook(
      () => ({
        active: useFetchSkills(roots),
        archived: useFetchArchivedSkills(roots, false),
      }),
      { wrapper: wrapper(client) },
    );
    await waitFor(() =>
      expect(hook.result.current.archived.archivedSkills).toHaveLength(1),
    );
    const before = hook.result.current;
    hook.rerender();
    expect(hook.result.current.active.skills).toBe(before.active.skills);
    expect(hook.result.current.archived.archivedSkills).toBe(
      before.archived.archivedSkills,
    );
    expect(invoke).toHaveBeenCalledWith('list_archived_skills', {
      rootPath: root.path,
      includeContent: false,
    });
  });

  it('refreshes full-text search when immutable skill data changes', () => {
    const first = skill('review', { content: 'OLD 본문' });
    expect(matchesSkillSearch(first, 'old 본문')).toBe(true);
    const updated = { ...first, content: 'NEW 본문' };
    expect(matchesSkillSearch(updated, 'new 본문')).toBe(true);
    expect(matchesSkillSearch(updated, 'old 본문')).toBe(false);
  });
});

describe('large sidebar virtualization', () => {
  const mount = () => {
    const skills = Array.from({ length: 1000 }, (_, i) =>
      skill(`skill-${String(i).padStart(4, '0')}`),
    );
    const props: SkillListProps = {
      skills,
      hiddenSkills: [],
      hiddenFolderPaths: new Set(),
      selectedSkillIds: new Set(),
      isLoading: false,
      error: null,
      removingSkillIds: new Set(),
      showingHidden: false,
      onFolderVisibilityChange: vi.fn(),
      onSelectionChange: vi.fn(),
      onClearSelection: vi.fn(),
      onRemoveSkills: vi.fn(),
      onHideSkills: vi.fn(),
      onShowSkills: vi.fn(),
      onShowingHiddenChange: vi.fn(),
    };
    return { skills, props, ...render(<SkillList {...props} />) };
  };
  it('bounds mounted rows and selects ranges including offscreen skills', () => {
    const { props, skills, container } = mount();
    expect(screen.getAllByRole('button').length).toBeLessThan(100);
    fireEvent.click(
      screen.getByRole('button', { name: 'skill-0000 Instructions' }),
    );
    const viewport = container.querySelector(
      '[data-radix-scroll-area-viewport]',
    )!;
    fireEvent.scroll(viewport, { target: { scrollTop: 100_000 } });
    fireEvent.click(
      screen.getByRole('button', { name: 'skill-0999 Instructions' }),
      { shiftKey: true },
    );
    expect(props.onSelectionChange).toHaveBeenLastCalledWith(
      skills,
      skills[999],
    );
    expect(screen.getAllByRole('button').length).toBeLessThan(100);
  });
  it('commits only the row whose selection changed', () => {
    const { props, skills, rerender } = mount();
    rowCommit.mockClear();
    rerender(
      <SkillList
        {...props}
        selectedSkillIds={new Set([getSkillIdentity(skills[0])])}
      />,
    );
    expect(rowCommit.mock.calls.map(call => call[0])).toEqual([
      getSkillIdentity(skills[0]),
    ]);
  });
  it('moves keyboard focus to the final offscreen row and resets search scrolling', () => {
    const { container } = mount();
    const first = screen.getByRole('button', {
      name: 'skill-0000 Instructions',
    });
    first.focus();
    fireEvent.keyDown(first, { key: 'End' });
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'skill-0999 Instructions' }),
    );
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'skill-0000' },
    });
    expect(
      screen.getByRole('button', { name: 'skill-0000 Instructions' }),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-radix-scroll-area-viewport]')!.scrollTop,
    ).toBe(0);
  });
});
