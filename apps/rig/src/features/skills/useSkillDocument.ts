import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { toast } from '@allin/ui';
import { z } from 'zod';
import { useI18n } from '@/lib/preferences';
import type { Message } from '@/lib/translations';
import type { Skill } from './types';

const documentSchema = z.object({ content: z.string(), revision: z.string() });
type Document = z.infer<typeof documentSchema>;
interface State {
  content: string;
  saved: Document | null;
  loading: boolean;
  saving: boolean;
  error: 'conflict' | 'load' | 'save' | null;
}
type Translate = (message: Message) => string;
const sessions = new WeakMap<QueryClient, Map<string, SkillDocumentSession>>();

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
  private t: Translate;
  setTranslator = (t: Translate) => {
    this.t = t;
  };
  constructor(
    private client: QueryClient,
    private rootPath: string,
    private relativePath: string,
    t: Translate,
  ) {
    this.t = t;
  }
  getSnapshot = () => this.state;
  subscribe = (notify: () => void) => {
    this.listeners.add(notify);
    return () => {
      this.listeners.delete(notify);
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
    this.state = { ...this.state, ...change };
    window.removeEventListener('beforeunload', this.beforeUnload);
    if (this.dirty || this.state.saving)
      window.addEventListener('beforeunload', this.beforeUnload);
    this.listeners.forEach(notify => notify());
  }
  load = (): Promise<void> => {
    if (this.loading) return this.loading;
    if (this.dirty || this.saving) return Promise.resolve();
    this.loading = this.read().finally(() => {
      this.loading = null;
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
      if (!this.dirty && !this.saving && this.state.saved === savedAtStart)
        this.update({
          content: document.content,
          saved: document,
          error: null,
        });
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
    });
    return this.saving;
  };
  private async write(): Promise<boolean> {
    this.update({ saving: true });
    let wrote = false;
    try {
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
        this.update({ saved, error: null });
        wrote = true;
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
      if (wrote) void this.client.invalidateQueries({ queryKey: ['skills'] });
    }
  }
  discardAndReload = async () => {
    if (this.saving) await this.saving;
    clearTimeout(this.timer);
    this.update({ content: this.state.saved?.content ?? '', error: null });
    await this.load();
  };
}

export const useSkillDocument = (skill: Skill) => {
  const client = useQueryClient();
  const { t } = useI18n();
  const session = useMemo(() => {
    let documents = sessions.get(client);
    if (!documents) {
      documents = new Map();
      sessions.set(client, documents);
    }
    const key = JSON.stringify([skill.rootPath, skill.relativePath]);
    let document = documents.get(key);
    if (!document) {
      document = new SkillDocumentSession(
        client,
        skill.rootPath,
        skill.relativePath,
        t,
      );
      documents.set(key, document);
    }
    return document;
  }, [client, skill.rootPath, skill.relativePath, t]);
  useEffect(() => {
    session.setTranslator(t);
  }, [session, t]);
  const state = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getSnapshot,
  );
  useEffect(() => {
    void session.load();
    const refresh = () => {
      void session.load();
    };
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
    };
  }, [session, skill.updatedAt]);
  return { ...state, dirty: session.dirty, session };
};
