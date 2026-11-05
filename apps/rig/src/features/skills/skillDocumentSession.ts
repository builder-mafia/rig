import { invoke } from '@tauri-apps/api/core';
import { QueryClient, type QueryFilters } from '@tanstack/react-query';
import { toast } from '@allin/ui';
import { z } from 'zod';
import type { Message } from '@/lib/translations';
import { SkillSchema, type Skill } from './types';
import { getSkillFilePath } from './insights';
import { normalizeSkillPath } from './skillRemoval';

const summarySchema = SkillSchema.pick({
  name: true,
  description: true,
  content: true,
  isValid: true,
  validationError: true,
  updatedAt: true,
});
const documentSchema = z.object({
  content: z.string(),
  revision: z.string(),
  summary: summarySchema.optional(),
});
type Document = Pick<z.infer<typeof documentSchema>, 'content' | 'revision'>;
interface State {
  content: string;
  saved: Document | null;
  loading: boolean;
  saving: boolean;
  error: 'conflict' | 'load' | 'save' | null;
}
type Translate = (message: Message) => string;

// Sessions outlive the selected row: switching skills cannot lose a draft or
// send its pending save to the next skill. Failed drafts stay available on return.
export class SkillDocumentSession {
  private state: State = {
    content: '',
    saved: null,
    loading: true,
    saving: false,
    error: null,
  };
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private loading: Promise<void> | null = null;
  private saving: Promise<boolean> | null = null;
  private composing = false;
  private guarded = false;
  private loadedUpdatedAt: string | null | undefined;
  private status = {
    dirty: false,
    saving: false,
    error: null as State['error'],
  };
  private t: Translate;
  setTranslator = (t: Translate) => {
    this.t = t;
  };
  constructor(
    private client: QueryClient,
    private rootPath: string,
    private relativePath: string,
    t: Translate,
    private onIdle: () => void = () => {},
  ) {
    this.t = t;
  }
  getSnapshot = () => this.state;
  getContentSnapshot = () => this.state.content;
  getStatusSnapshot = () => this.status;
  getReadinessSnapshot = () =>
    this.state.loading ? 'loading' : this.state.saved ? 'ready' : 'unavailable';
  get evictable() {
    return !this.listeners.size && !this.loading && !this.saving && !this.dirty;
  }
  get retainedCharacters() {
    return (
      this.state.content.length +
      (this.dirty ? this.state.saved!.content.length : 0)
    );
  }
  dispose() {
    clearTimeout(this.timer);
    window.removeEventListener('beforeunload', this.beforeUnload);
  }
  subscribe = (notify: () => void) => {
    this.listeners.add(notify);
    return () => {
      this.listeners.delete(notify);
      this.onIdle();
    };
  };
  get dirty() {
    return (
      this.state.saved !== null &&
      this.state.content !== this.state.saved.content
    );
  }
  private beforeUnload = (event: BeforeUnloadEvent) => {
    event.preventDefault();
    event.returnValue = '';
  };
  private update(change: Partial<State>) {
    if (
      (Object.keys(change) as Array<keyof State>).every(key =>
        Object.is(change[key], this.state[key]),
      )
    )
      return;
    this.state = { ...this.state, ...change };
    const guarded = this.dirty || this.state.saving;
    if (guarded !== this.guarded) {
      this.guarded = guarded;
      if (guarded) window.addEventListener('beforeunload', this.beforeUnload);
      else window.removeEventListener('beforeunload', this.beforeUnload);
    }
    if (
      this.status.dirty !== this.dirty ||
      this.status.saving !== this.state.saving ||
      this.status.error !== this.state.error
    )
      this.status = {
        dirty: this.dirty,
        saving: this.state.saving,
        error: this.state.error,
      };
    this.listeners.forEach(notify => notify());
  }
  private accept(
    document: z.infer<typeof documentSchema>,
    replaceContent = false,
  ) {
    const saved =
      this.state.saved?.revision === document.revision
        ? this.state.saved
        : { content: document.content, revision: document.revision };
    this.update({
      saved,
      error: null,
      ...(replaceContent ? { content: document.content } : {}),
    });
    if (document.summary) {
      this.loadedUpdatedAt = document.summary.updatedAt;
      const summary = document.summary;
      this.client.setQueriesData<Skill[]>(this.queryFilters(), previous => {
        if (!previous) return previous;
        return previous.map(skill =>
          (
            skill.rootPath === this.rootPath
              ? skill.relativePath === this.relativePath
              : normalizeSkillPath(getSkillFilePath(skill)) === this.filePath()
          )
            ? { ...skill, ...summary }
            : skill,
        );
      });
    }
  }
  private filePath() {
    return normalizeSkillPath(
      getSkillFilePath({
        rootPath: this.rootPath,
        relativePath: this.relativePath,
        isArchived: false,
      }),
    );
  }
  private queryFilters(): QueryFilters {
    const path = this.filePath();
    return {
      queryKey: ['skills'],
      // A file may also appear under an imported ancestor root.
      predicate: query =>
        typeof query.queryKey[2] === 'string' &&
        path.startsWith(`${normalizeSkillPath(query.queryKey[2])}/`),
    };
  }
  load = (updatedAt?: string | null): Promise<void> => {
    if (this.loading) return this.loading;
    if (this.dirty || this.saving) return Promise.resolve();
    if (
      this.state.saved &&
      updatedAt !== undefined &&
      updatedAt === this.loadedUpdatedAt
    )
      return Promise.resolve();
    this.loading = this.read().finally(() => {
      this.loading = null;
      this.onIdle();
    });
    return this.loading;
  };
  private async read() {
    const savedAtStart = this.state.saved;
    if (!this.state.saved) this.update({ loading: true });
    try {
      const document = documentSchema.parse(
        await invoke('read_skill_document', {
          rootPath: this.rootPath,
          relativePath: this.relativePath,
        }),
      );
      // A refresh can finish after typing starts. Keep that draft and revision.
      if (!this.dirty && !this.saving && this.state.saved === savedAtStart) {
        this.accept(document, true);
      }
    } catch {
      this.update({ error: 'load' });
    } finally {
      this.update({ loading: false });
    }
  }
  change = (content: string) => {
    this.update({ content });
    clearTimeout(this.timer);
    if (!this.composing && !this.state.error && this.dirty)
      this.timer = setTimeout(() => void this.save(), 1000);
  };
  composition = (active: boolean) => {
    this.composing = active;
    clearTimeout(this.timer);
    if (!active) this.change(this.state.content);
  };
  save = (): Promise<boolean> => {
    clearTimeout(this.timer);
    if (this.saving) return this.saving;
    if (!this.state.saved) return Promise.resolve(false);
    if (!this.dirty) return Promise.resolve(true);
    this.saving = this.write().finally(() => {
      this.saving = null;
      this.onIdle();
    });
    return this.saving;
  };
  private async write(): Promise<boolean> {
    this.update({ saving: true });
    try {
      // An older scan must not overwrite the row returned by this save.
      void this.client.cancelQueries(this.queryFilters());
      do {
        const content = this.state.content;
        const saved = documentSchema.parse(
          await invoke('save_skill_document', {
            rootPath: this.rootPath,
            relativePath: this.relativePath,
            content,
            expectedRevision: this.state.saved!.revision,
          }),
        );
        this.accept(saved);
        // Compatibility with an older native backend during frontend development.
        if (!saved.summary)
          void this.client.invalidateQueries(this.queryFilters());
      } while (this.dirty && !this.composing);
      if (!this.dirty)
        toast.success(this.t('Content updated'), {
          id: `saved:${this.rootPath}/${this.relativePath}`,
          position: 'top-center',
        });
      return !this.dirty;
    } catch (cause) {
      const conflict =
        typeof cause === 'object' &&
        cause !== null &&
        'code' in cause &&
        cause.code === 'conflict';
      this.update({ error: conflict ? 'conflict' : 'save' });
      toast.error(
        this.t(
          conflict
            ? 'This file changed in another app.'
            : 'Couldn’t save changes.',
        ),
        { position: 'top-center' },
      );
      return false;
    } finally {
      this.update({ saving: false });
    }
  }
  discardAndReload = async () => {
    if (this.saving) await this.saving;
    clearTimeout(this.timer);
    this.update({ content: this.state.saved?.content ?? '', error: null });
    await this.load();
  };
}

const sessions = new WeakMap<QueryClient, Map<string, SkillDocumentSession>>();
const MAX_CACHED_DOCUMENTS = 20;
const MAX_CACHED_CHARACTERS = 1_000_000;

export const getSkillDocumentSession = (
  client: QueryClient,
  skill: Pick<Skill, 'rootPath' | 'relativePath'>,
  t: Translate,
) => {
  let documents = sessions.get(client);
  if (!documents) {
    documents = new Map();
    sessions.set(client, documents);
  }
  const cache = documents;
  const prune = (protectedSession?: SkillDocumentSession) => {
    let characters = 0;
    for (const session of cache.values())
      characters += session.retainedCharacters;
    for (const [key, session] of cache) {
      if (
        cache.size <= MAX_CACHED_DOCUMENTS &&
        characters <= MAX_CACHED_CHARACTERS
      )
        break;
      // Drafts (including failed saves), pending IO and mounted editors survive.
      if (session === protectedSession || !session.evictable) continue;
      session.dispose();
      cache.delete(key);
      characters -= session.retainedCharacters;
    }
  };
  const key = JSON.stringify([skill.rootPath, skill.relativePath]);
  let session = cache.get(key);
  if (!session)
    session = new SkillDocumentSession(
      client,
      skill.rootPath,
      skill.relativePath,
      t,
      prune,
    );
  cache.delete(key);
  cache.set(key, session);
  prune(session);
  return session;
};
