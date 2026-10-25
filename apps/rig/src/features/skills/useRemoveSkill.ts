import { useI18n } from '@/lib/preferences';
import { toast } from '@allin/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Effect } from 'effect';
import { RemoveSkillError, removeSkill as removeSkillApi } from './api';
import type { Skill, SkillDeletionError } from './types';

export const useRemoveSkill = ({
  onRemoved,
}: {
  onRemoved?: (skill: Skill) => void;
} = {}) => {
  const { t } = useI18n();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (skills: Skill[]) =>
      Promise.all(
        skills.map(skill => Effect.runPromise(removeSkillApi(skill))),
      ),
    onSuccess: (_, skills) => {
      skills.forEach(skill => onRemoved?.(skill));
      toast.success(
        skills.length === 1
          ? t('{name} skill removed', { name: skills[0].name })
          : t('{count} skills removed', { count: skills.length }),
        {
          description:
            skills.length === 1
              ? t('The skill folder was deleted from disk.')
              : t('The selected skill folders were deleted from disk.'),
        },
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ['skills'],
      });
    },
    onError: (error, skills) => {
      const deletionError = getSkillDeletionError(error);

      toast.error(
        skills.length === 1
          ? t('Failed to remove {name}', { name: skills[0].name })
          : t('Failed to remove all {count} skills', { count: skills.length }),
        {
          description: deletionError?.message ?? getErrorMessage(error),
        },
      );
    },
  });

  const removingSkillIds = new Set(
    (mutation.isPending ? (mutation.variables ?? []) : []).map(
      getSkillIdentity,
    ),
  );

  return {
    removeSkill: (skill: Skill) => mutation.mutate([skill]),
    removeSkills: mutation.mutate,
    removingSkillIds,
    isRemoving: mutation.isPending,
  };
};

export const getSkillIdentity = (
  skill: Pick<Skill, 'rootPath' | 'relativePath'> &
    Partial<Pick<Skill, 'isArchived'>>,
) =>
  `${skill.rootPath}:${skill.relativePath}:${skill.isArchived ? 'archived' : 'active'}`;

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
