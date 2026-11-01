import { useI18n } from '@/lib/preferences';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@allin/ui';
import { Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { getSkillFilePath } from '../insights';
import type { Skill } from '../types';

export interface SkillRemovalRequest {
  skills: Skill[];
  folder?: { label: string; path: string };
}

export const DeleteSkillsDialog = ({
  request,
  onConfirm,
  onClose,
}: {
  request: SkillRemovalRequest;
  onConfirm: (skills: Skill[], preserveFolderPath?: string) => void;
  onClose: () => void;
}) => {
  const { t } = useI18n();
  const deleteButton = useRef<HTMLButtonElement>(null);
  const submitted = useRef(false);
  const { skills, folder } = request;

  return (
    <AlertDialog
      open
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent
        onOpenAutoFocus={event => {
          event.preventDefault();
          deleteButton.current?.focus();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            {folder
              ? t('Delete all {count} skills in “{name}”?', {
                  count: skills.length,
                  name: folder.label,
                })
              : skills.length === 1
                ? t('Delete “{name}”?', { name: skills[0].name })
                : t('Delete {count} skills?', { count: skills.length })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              'This permanently deletes the listed skills and their supporting files. This cannot be undone.',
            )}
            {folder ? (
              <>
                <span className='mt-2 block'>
                  {t(
                    'Includes skills in subfolders and hidden skills, regardless of search filters. The selected folder itself is kept.',
                  )}
                </span>
                <span className='mt-2 block break-all font-mono text-xs text-foreground'>
                  {folder.path}
                </span>
              </>
            ) : null}
            {skills.some(
              skill =>
                !skill.relativePath ||
                getSkillFilePath(skill) === `${folder?.path}/SKILL.md`,
            ) ? (
              <span className='mt-2 block'>
                {t(
                  'For a skill directly in a project or selected folder, only SKILL.md is deleted; other files are kept.',
                )}
              </span>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ul
          aria-label={t('Skills to delete')}
          className='max-h-48 space-y-2 overflow-y-auto rounded-md border border-border/60 p-3 text-xs'
        >
          {skills.map(skill => (
            <li key={getSkillFilePath(skill)}>
              <span className='block font-medium'>{skill.name}</span>
              <span className='block break-all text-muted-foreground'>
                {getSkillFilePath(skill)}
              </span>
            </li>
          ))}
        </ul>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
          <AlertDialogAction
            ref={deleteButton}
            variant='destructive-outline'
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                if (!event.repeat && !event.nativeEvent.isComposing)
                  event.currentTarget.click();
              }
            }}
            onClick={() => {
              if (submitted.current) return;
              submitted.current = true;
              onConfirm(skills, folder?.path);
              onClose();
            }}
          >
            <Trash2 />
            {t('Delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
