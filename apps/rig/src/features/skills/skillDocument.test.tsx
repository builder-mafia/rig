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
import { SkillDocumentSession } from './useSkillDocument';
import { SkillContentViewer } from './components/SkillContentViewer';
import { translate } from '@/lib/translations';
import type { Skill } from './types';

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }));
vi.mock('@allin/ui', async original => ({
  ...(await original<object>()),
  toast: { success: mocks.success, error: mocks.error },
}));
const raw =
  '---\nname: review\ndescription: Original description\ncustom: preserved\n---\n# Review\n';
const skill: Skill = {
  id: 'review',
  name: 'review',
  rootPath: '/demo/skills',
  relativePath: 'review',
  content: '# Review',
  description: 'Original description',
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
};
const client = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
const session = (relative = 'review') =>
  new SkillDocumentSession(client(), '/demo/skills', relative, translate('ko'));
const saveCalls = () =>
  mocks.invoke.mock.calls.filter(call => call[0] === 'save_skill_document');
const props = {
  isHidden: false,
  onBack: vi.fn(),
  onHideSkill: vi.fn(),
  onShowSkill: vi.fn(),
  onRestoreArchivedSkill: vi.fn(),
  isRestoring: false,
};
let documents: SkillDocumentSession[] = [];
beforeEach(() => {
  vi.clearAllMocks();
  documents = [];
  mocks.invoke.mockImplementation(async (command, args) => {
    if (command === 'read_skill_document')
      return { content: raw, revision: 'original' };
    if (command === 'save_skill_document')
      return { content: args.content, revision: 'saved' };
    if (command === 'list_skill_editors') return ['finder', 'cursor', 'vscode'];
    return [];
  });
});
afterEach(async () => {
  cleanup();
  for (const document of documents) {
    document.composition(true);
    // Detach unsaved-change guards without causing a disk write.
    if (document.getSnapshot().saved)
      document.change(document.getSnapshot().saved!.content);
  }
  vi.useRealTimers();
});
const loaded = async () => {
  const document = session();
  documents.push(document);
  await document.load();
  return document;
};

describe('skill document saves', () => {
  it('debounces exact full-file content and confirms only after saving at top center', async () => {
    vi.useFakeTimers();
    const document = await loaded();
    expect(document.getSnapshot().content).toBe(raw);
    document.change(raw + 'first');
    await vi.advanceTimersByTimeAsync(700);
    document.change(raw + '한글');
    await vi.advanceTimersByTimeAsync(999);
    expect(saveCalls()).toHaveLength(0);
    expect(mocks.success).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(saveCalls()[0][1]).toEqual({
      rootPath: '/demo/skills',
      relativePath: 'review',
      content: raw + '한글',
      expectedRevision: 'original',
    });
    expect(document.dirty).toBe(false);
    expect(mocks.success).toHaveBeenCalledWith(
      '내용이 수정되었습니다',
      expect.objectContaining({ position: 'top-center' }),
    );
  });
  it('does not save during IME composition or write unchanged content', async () => {
    vi.useFakeTimers();
    const document = await loaded();
    document.composition(true);
    document.change(raw + 'ㅎ');
    await vi.advanceTimersByTimeAsync(2000);
    expect(saveCalls()).toHaveLength(0);
    document.change(raw + '한');
    document.composition(false);
    await vi.advanceTimersByTimeAsync(1000);
    expect(saveCalls()).toHaveLength(1);
    await document.save();
    expect(saveCalls()).toHaveLength(1);
  });
  it('serializes typing during an in-flight save with the new revision', async () => {
    const document = await loaded();
    let finish!: (value: unknown) => void;
    mocks.invoke.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = resolve;
        }),
    );
    document.change(raw + 'first');
    const saving = document.save();
    document.change(raw + 'latest');
    expect(document.save()).toBe(saving);
    finish({ content: raw + 'first', revision: 'revision-2' });
    await saving;
    expect(saveCalls()).toHaveLength(2);
    expect(saveCalls()[1][1]).toMatchObject({
      content: raw + 'latest',
      expectedRevision: 'revision-2',
    });
    expect(document.getSnapshot().content).toBe(raw + 'latest');
    expect(document.dirty).toBe(false);
  });
  it('keeps failed drafts, does not retry in a loop, and reloads only on explicit discard', async () => {
    vi.useFakeTimers();
    const document = await loaded();
    document.change(raw + 'mine');
    mocks.invoke.mockRejectedValueOnce({ code: 'conflict' });
    expect(await document.save()).toBe(false);
    expect(document.getSnapshot()).toMatchObject({
      content: raw + 'mine',
      error: 'conflict',
    });
    document.change(raw + 'still mine');
    await vi.advanceTimersByTimeAsync(3000);
    expect(saveCalls()).toHaveLength(1);
    await document.load();
    expect(document.getSnapshot().content).toBe(raw + 'still mine');
    expect(mocks.success).not.toHaveBeenCalled();
    mocks.invoke.mockResolvedValueOnce({
      content: 'external',
      revision: 'external-revision',
    });
    await document.discardAndReload();
    expect(document.getSnapshot()).toMatchObject({
      content: 'external',
      error: null,
    });
  });
  it('keeps independent targets when switching skills before autosave fires', async () => {
    vi.useFakeTimers();
    const first = await loaded();
    const second = session('testing');
    documents.push(second);
    await second.load();
    first.change('first file');
    second.change('second file');
    await vi.advanceTimersByTimeAsync(1000);
    expect(
      saveCalls().map(call => [call[1].relativePath, call[1].content]),
    ).toEqual([
      ['review', 'first file'],
      ['testing', 'second file'],
    ]);
  });
  it('ignores a stale refresh that finishes after a successful save', async () => {
    const document = await loaded();
    let finish!: (value: unknown) => void;
    mocks.invoke.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = resolve;
        }),
    );
    const refreshing = document.load();
    document.change(raw + 'newest');
    await document.save();
    finish({ content: raw, revision: 'original' });
    await refreshing;
    expect(document.getSnapshot()).toMatchObject({
      content: raw + 'newest',
      saved: { revision: 'saved' },
    });
  });
  it('keeps a draft if a focus refresh finishes after typing starts', async () => {
    const document = await loaded();
    let finish!: (value: unknown) => void;
    mocks.invoke.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = resolve;
        }),
    );
    const loading = document.load();
    document.change(raw + 'mine');
    finish({ content: 'external', revision: 'external' });
    await loading;
    expect(document.getSnapshot()).toMatchObject({
      content: raw + 'mine',
      saved: { revision: 'original' },
    });
    await document.save();
  });
});

describe('inline file editor', () => {
  const mount = (selected = skill) => {
    const queryClient = client();
    return render(
      <QueryClientProvider client={queryClient}>
        <SkillContentViewer {...props} skill={selected} />
      </QueryClientProvider>,
    );
  };
  it('shows the raw editable file directly without tabs and saves with Command+S', async () => {
    mount();
    const editor = await screen.findByRole('textbox', {
      name: 'Skill file content',
    });
    expect((editor as HTMLTextAreaElement).value).toBe(raw);
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByText('Original description')).toBeNull();
    fireEvent.change(editor, { target: { value: raw + 'edited' } });
    fireEvent.keyDown(editor, { key: 's', metaKey: true });
    await waitFor(() => expect(saveCalls()).toHaveLength(1));
    expect(mocks.success).toHaveBeenCalledWith(
      'Content updated',
      expect.objectContaining({ position: 'top-center' }),
    );
  });
  it('shows only installed applications and saves before opening the selected skill', async () => {
    mount();
    const editor = await screen.findByRole('textbox', {
      name: 'Skill file content',
    });
    const cursor = await screen.findByRole('button', {
      name: 'Open in Cursor',
    });
    expect(
      screen.queryByRole('button', { name: 'Open in WebStorm' }),
    ).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open in Zed' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Open in Finder' })).toBeTruthy();
    fireEvent.change(editor, { target: { value: raw + 'latest' } });
    fireEvent.click(cursor);
    await waitFor(() =>
      expect(mocks.invoke).toHaveBeenCalledWith('open_skill_in_editor', {
        rootPath: '/demo/skills',
        relativePath: 'review',
        editor: 'cursor',
      }),
    );
    const commands = mocks.invoke.mock.calls.map(call => call[0]);
    expect(commands.indexOf('save_skill_document')).toBeLessThan(
      commands.indexOf('open_skill_in_editor'),
    );
  });
  it('retains a failed draft across selection changes', async () => {
    const queryClient = client();
    const view = (selected: Skill) => (
      <QueryClientProvider client={queryClient}>
        <SkillContentViewer {...props} skill={selected} />
      </QueryClientProvider>
    );
    const { rerender } = render(view(skill));
    const editor = await screen.findByRole('textbox', {
      name: 'Skill file content',
    });
    fireEvent.change(editor, { target: { value: raw + 'keep me' } });
    mocks.invoke.mockRejectedValueOnce({ code: 'io' });
    fireEvent.keyDown(editor, { key: 's', ctrlKey: true });
    await screen.findByRole('alert');
    rerender(view({ ...skill, id: 'another', relativePath: 'another' }));
    await screen.findByRole('textbox', { name: 'Skill file content' });
    rerender(view(skill));
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(
      raw + 'keep me',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
  it('keeps archived skills read-only and does not offer installed editors', async () => {
    mount({ ...skill, isArchived: true });
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByRole('button', { name: 'Restore file' })).toBeTruthy();
    await act(async () => {});
    expect(mocks.invoke).not.toHaveBeenCalledWith(
      'read_skill_document',
      expect.anything(),
    );
    expect(screen.queryByRole('button', { name: 'Open in Cursor' })).toBeNull();
  });
});
