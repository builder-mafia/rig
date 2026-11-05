import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/lib/preferences';
import type { Skill } from './types';
import {
  getSkillDocumentSession,
  type SkillDocumentSession,
} from './skillDocumentSession';

export { SkillDocumentSession } from './skillDocumentSession';

// The owner handles lifetime only. Consumers subscribe to the fields they render.
export const useSkillDocumentSession = (skill: Skill) => {
  const client = useQueryClient();
  const { t } = useI18n();
  const { rootPath, relativePath } = skill;
  const session = useMemo(
    () => getSkillDocumentSession(client, { rootPath, relativePath }, t),
    [client, rootPath, relativePath, t],
  );
  useEffect(() => session.setTranslator(t), [session, t]);
  useEffect(() => {
    void session.load(skill.updatedAt);
  }, [session, skill.updatedAt]);
  useEffect(() => {
    const refresh = () => {
      void session.load();
    };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [session]);
  return session;
};

export const useSkillDocumentStatus = (session: SkillDocumentSession) =>
  useSyncExternalStore(
    session.subscribe,
    session.getStatusSnapshot,
    session.getStatusSnapshot,
  );

export const useSkillDocumentReadiness = (session: SkillDocumentSession) =>
  useSyncExternalStore(
    session.subscribe,
    session.getReadinessSnapshot,
    session.getReadinessSnapshot,
  );

export const useSkillDocumentContent = (session: SkillDocumentSession) =>
  useSyncExternalStore(
    session.subscribe,
    session.getContentSnapshot,
    session.getContentSnapshot,
  );
