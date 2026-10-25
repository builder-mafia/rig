import { useI18n } from '@/lib/preferences';
import { toast } from '@allin/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Effect } from 'effect';
import { restoreSkill as restoreSkillApi } from './api';
import type { Skill } from './types';

// Recovery for files moved by older versions. Hiding a skill never uses this API.
export const useRestoreArchivedSkill = ({
  onRestored,
}: {
  onRestored?: (skill: Skill) => void;
} = {}) => {
  const { t } = useI18n();

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (skill: Skill) => Effect.runPromise(restoreSkillApi(skill)),
    onSuccess: (_, skill) => {
      onRestored?.(skill);
      toast.success(t('{name} restored', { name: skill.name }), {
        description: t(
          'The file is back in its original folder and available to agents.',
        ),
      });
    },
    onError: error =>
      toast.error(t('Couldn’t restore the archived file.'), {
        description: String(error),
      }),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['skills'] }),
        queryClient.invalidateQueries({ queryKey: ['archived-skills'] }),
      ]),
  });
  return { restoreSkill: mutation.mutate, isRestoring: mutation.isPending };
};
