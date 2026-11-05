import { useI18n } from '@/lib/preferences';
import { toast } from '@allin/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Effect } from 'effect';
import { useCallback, useMemo, useRef } from 'react';
import {
  getSkillDirectory,
  getUniqueActiveSkills,
  normalizeSkillPath,
} from './skillRemoval';
import { RemoveSkillError, removeSkill as removeSkillApi } from './api';
import type { Skill, SkillDeletionError } from './types';
import { getSkillIdentity } from './skillIdentity';
export { getSkillIdentity } from './skillIdentity';

export const useRemoveSkill = ({
  onRemoved,
}: {
  onRemoved?: (skill: Skill) => void;
} = {}) => {
  const { t } = useI18n();

  const queryClient = useQueryClient();

  const inFlight = useRef(false);
  const mutation = useMutation({
    mutationFn: async ({
      skills,
      preserveFolderPath,
    }: {
      skills: Skill[];
      preserveFolderPath?: string;
    }) => {
      const removed: Skill[] = [];
      const failed: { skill: Skill; error: unknown }[] = [];
      // Delete children first so nested skills are never raced against their parents.
      const ordered = [...skills].sort(
        (a, b) => getSkillDirectory(b).length - getSkillDirectory(a).length,
      );
      for (const skill of ordered) {
        if (
          failed.some(item =>
            getSkillDirectory(item.skill).startsWith(
              `${getSkillDirectory(skill)}/`,
            ),
          )
        ) {
          failed.push({
            skill,
            error: new Error(t('A nested skill could not be deleted.')),
          });
          continue;
        }
        try {
          await Effect.runPromise(
            removeSkillApi({
              ...skill,
              preserveDirectory:
                preserveFolderPath !== undefined &&
                getSkillDirectory(skill) ===
                  normalizeSkillPath(preserveFolderPath),
            }),
          );
          removed.push(skill);
        } catch (error) {
          failed.push({ skill, error });
        }
      }
      return { removed, failed };
    },
    onSuccess: ({ removed, failed }, { skills }) => {
      removed.forEach(skill => onRemoved?.(skill));
      if (failed.length) {
        const error = failed[0].error;
        const description = t('Failed: {names}. {error}', {
          names: failed.map(({ skill }) => skill.name).join(', '),
          error:
            getSkillDeletionError(error)?.message ?? getErrorMessage(error),
        });
        if (removed.length) {
          toast.warning(
            t('Deleted {count} of {total} skills', {
              count: removed.length,
              total: skills.length,
            }),
            { description },
          );
        } else {
          toast.error(
            t('Failed to remove all {count} skills', { count: skills.length }),
            { description },
          );
        }
        return;
      }
      toast.success(
        removed.length === 1
          ? t('{name} skill removed', { name: removed[0].name })
          : t('{count} skills removed', { count: removed.length }),
      );
    },
    onSettled: async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: ['skills'] });
      } finally {
        inFlight.current = false;
      }
    },
  });

  const removingSkillIds = useMemo(
    () =>
      new Set(
        (mutation.isPending ? (mutation.variables?.skills ?? []) : []).map(
          getSkillIdentity,
        ),
      ),
    [mutation.isPending, mutation.variables],
  );
  const { mutate } = mutation;
  const removeSkills = useCallback(
    (skills: Skill[], preserveFolderPath?: string) => {
      const uniqueSkills = getUniqueActiveSkills(skills);
      if (inFlight.current || uniqueSkills.length === 0) return;
      inFlight.current = true;
      mutate({ skills: uniqueSkills, preserveFolderPath });
    },
    [mutate],
  );
  return {
    removeSkill: (skill: Skill) => removeSkills([skill]),
    removeSkills,
    removingSkillIds,
    isRemoving: mutation.isPending,
  };
};

const getSkillDeletionError = (error: unknown) => {
  if (
    error instanceof RemoveSkillError &&
    error.kind === 'SkillDeletionError'
  ) {
    return error.cause as SkillDeletionError;
  }

  return null;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};
