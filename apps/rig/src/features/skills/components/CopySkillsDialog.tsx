import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  toast,
} from '@allin/ui';
import { ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { useI18n } from '@/lib/preferences';
import { abbreviateHomePath } from '../skillTree';
import type { Skill } from '../types';
import { skillRootsQueryKey, useSkillRoots } from '../useSkillRoots';

export const CopySkillsDialog = ({
  skills,
  onClose,
}: {
  skills: Skill[];
  onClose: () => void;
}) => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data: roots = [], isLoading, isError } = useSkillRoots();
  const [remaining, setRemaining] = useState(skills);
  const [destination, setDestination] = useState<{
    rootPath: string;
    relativeFolder: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const projects = roots
    .filter(
      (root, index) =>
        root.scopeKind === 'repository' &&
        root.exists &&
        roots.findIndex(candidate => candidate.scopeId === root.scopeId) ===
          index,
    )
    .sort((a, b) => a.scopeLabel.localeCompare(b.scopeLabel));

  const copyTo = async (rootPath: string, relativeFolder: string) => {
    const toastId = toast.loading(
      t('Copying {count} skills…', {
        count: remaining.length,
      }),
      { position: 'top-center' },
    );
    const copied: string[] = [];
    const failed: Skill[] = [];
    for (const skill of remaining) {
      try {
        const result = await invoke<{ path: string }>('copy_skill_to_folder', {
          sourceRootPath: skill.rootPath,
          sourceRelativePath: skill.relativePath,
          targetRootPath: rootPath,
          targetRelativeFolder: relativeFolder,
        });
        copied.push(result.path);
      } catch {
        failed.push(skill);
      }
    }
    if (copied.length) {
      void queryClient.invalidateQueries({ queryKey: ['skills'] });
      void queryClient.invalidateQueries({ queryKey: skillRootsQueryKey });
    }
    if (!failed.length) {
      toast.success(
        t(copied.length === 1 ? 'Skill copied' : 'Copied {count} skills', {
          count: copied.length,
        }),
        {
          id: toastId,
          position: 'top-center',
          description: copied.length === 1 ? copied[0] : rootPath,
        },
      );
      onClose();
      return;
    }
    // Retrying after a partial success must not duplicate the successful copies.
    setRemaining(failed);
    const options = {
      id: toastId,
      position: 'top-center' as const,
      description: t(
        'Check the source files and folder permissions, then try again. Failed: {names}',
        { names: failed.map(skill => skill.name).join(', ') },
      ),
    };
    if (copied.length) {
      toast.warning(
        t('Copied {count} of {total} skills', {
          count: copied.length,
          total: remaining.length,
        }),
        options,
      );
    } else {
      toast.error(t('Couldn’t copy skills'), options);
    }
  };

  const choose = async (projectPath?: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const path =
        projectPath ??
        (await open({
          title: t('Choose a folder to copy skills into'),
          directory: true,
          multiple: false,
        }));
      if (typeof path === 'string') {
        setDestination({
          rootPath: path,
          relativeFolder: projectPath ? '.agents/skills' : '',
        });
      }
    } catch {
      toast.error(t('Couldn’t open the folder picker.'), {
        position: 'top-center',
      });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const confirmCopy = async () => {
    if (!destination || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await copyTo(destination.rootPath, destination.relativeFolder);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const destinationPath = destination
    ? destination.relativeFolder
      ? `${destination.rootPath.replace(/[\\/]+$/, '')}/${destination.relativeFolder}`
      : destination.rootPath
    : '';

  const rowClass =
    'flex w-full min-w-0 items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';
  return (
    <Dialog
      open
      onOpenChange={value => {
        if (!value && !busyRef.current) onClose();
      }}
    >
      <DialogContent
        closeLabel={t('Close')}
        showCloseButton={!busy}
        className='gap-3 border-border/60 p-4 sm:max-w-md'
        aria-busy={busy}
      >
        <DialogHeader className='min-w-0 px-2 pt-1 text-left'>
          <DialogTitle>
            {t(destination ? 'Confirm copy' : 'Copy to folder')}
          </DialogTitle>
          <DialogDescription className='break-words'>
            {destination
              ? remaining.length === 1
                ? t('Copy “{name}” to this folder?', {
                    name: remaining[0].name,
                  })
                : t('Copy {count} skills to this folder?', {
                    count: remaining.length,
                  })
              : remaining.length === 1
                ? t('Choose a destination for “{name}”.', {
                    name: remaining[0].name,
                  })
                : t('Choose a destination for {count} skills.', {
                    count: remaining.length,
                  })}
          </DialogDescription>
        </DialogHeader>
        {destination ? (
          <>
            <div className='min-w-0 rounded-md border border-border/60 bg-muted/30 px-3 py-2.5'>
              <p className='break-all text-sm'>{destinationPath}</p>
            </div>
            <DialogFooter className='gap-2 pt-2 sm:justify-between'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                disabled={busy}
                onClick={() => setDestination(null)}
              >
                {t('Back')}
              </Button>
              <div className='flex justify-end gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  autoFocus
                  disabled={busy}
                  onClick={onClose}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  type='button'
                  size='sm'
                  disabled={busy}
                  onClick={() => void confirmCopy()}
                >
                  {busy ? t('Copying…') : t('Copy')}
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className='min-w-0'>
              <p className='px-3 pb-1 text-xs text-muted-foreground'>
                {t('Projects')}
              </p>
              <div className='max-h-64 min-w-0 overflow-y-auto'>
                {projects.map(project => (
                  <button
                    key={project.scopeId}
                    type='button'
                    disabled={busy}
                    onClick={() => void choose(project.path)}
                    className={rowClass}
                  >
                    <Folder
                      size={16}
                      className='shrink-0 text-muted-foreground'
                    />
                    <span className='min-w-0 flex-1'>
                      <span className='block truncate text-sm font-medium'>
                        {project.scopeLabel}
                      </span>
                      <span
                        className='block truncate text-xs text-muted-foreground'
                        title={`${project.path}/.agents/skills`}
                      >
                        {abbreviateHomePath(project.path)}/.agents/skills
                      </span>
                    </span>
                    <ChevronRight
                      size={14}
                      className='shrink-0 text-muted-foreground'
                    />
                  </button>
                ))}
                {!projects.length ? (
                  <p className='px-3 py-3 text-xs text-muted-foreground'>
                    {isLoading
                      ? t('Loading projects…')
                      : isError
                        ? t(
                            'Couldn’t load projects. Choose Custom to select a folder.',
                          )
                        : t(
                            'No projects found. Choose Custom to select a folder.',
                          )}
                  </p>
                ) : null}
              </div>
            </div>
            <div className='border-t border-border/60 pt-2'>
              <button
                type='button'
                disabled={busy}
                onClick={() => void choose()}
                className={rowClass}
              >
                <FolderOpen
                  size={16}
                  className='shrink-0 text-muted-foreground'
                />
                <span className='flex-1 text-sm font-medium'>
                  {t('Custom')}
                </span>
                <ChevronRight
                  size={14}
                  className='shrink-0 text-muted-foreground'
                />
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
