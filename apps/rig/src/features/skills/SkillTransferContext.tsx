import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { toast } from '@allin/ui';
import { useI18n } from '@/lib/preferences';
import type { Skill, SkillRoot } from './types';
import { skillRootsQueryKey } from './useSkillRoots';
import {
  createSkillTransfer,
  getFolderCopyTarget,
  getRepositoryCopyTarget,
  hasSkillTransfer,
  isTextEditing,
  readSkillTransfer,
  writeSkillTransfer,
  type SkillCopyTarget,
  type SkillTransfer,
} from './skillTransfer';

export const useSkillTransferController = (
  roots: SkillRoot[],
  scopeId: string,
) => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const busy = useRef(false);
  const [folder, setFolder] = useState<{
    scopeId: string;
    path: string;
  } | null>(null);
  const target =
    folder?.scopeId === scopeId
      ? getFolderCopyTarget(roots, folder.path)
      : getRepositoryCopyTarget(roots, scopeId);
  const copyTo = async (
    payload: SkillTransfer,
    destination: SkillCopyTarget | null,
  ) => {
    if (!destination) {
      toast.info(t('Choose a project or folder to paste skills into.'));
      return;
    }
    if (busy.current) return;
    busy.current = true;
    const toastId = toast.loading(
      t(
        payload.skills.length === 1
          ? 'Copying skill…'
          : 'Copying {count} skills…',
        { count: payload.skills.length },
      ),
    );
    const copied: string[] = [];
    const failed: string[] = [];
    try {
      for (const skill of payload.skills) {
        try {
          const result = await invoke<{ path: string }>(
            'copy_skill_to_folder',
            {
              sourceRootPath: skill.rootPath,
              sourceRelativePath: skill.relativePath,
              targetRootPath: destination.rootPath,
              targetRelativeFolder: destination.relativeFolder,
            },
          );
          copied.push(result.path);
        } catch {
          failed.push(skill.name);
        }
      }
      if (copied.length) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['skills'] }),
          queryClient.invalidateQueries({ queryKey: skillRootsQueryKey }),
        ]);
      }
      if (!failed.length) {
        toast.success(
          t(copied.length === 1 ? 'Skill copied' : 'Copied {count} skills', {
            count: copied.length,
          }),
          {
            id: toastId,
            description: copied.length === 1 ? copied[0] : destination.path,
          },
        );
      } else {
        const title = copied.length
          ? t('Copied {count} of {total} skills', {
              count: copied.length,
              total: payload.skills.length,
            })
          : t('Couldn’t copy skills');
        const description = t(
          'Check the source files and folder permissions, then try again. Failed: {names}',
          { names: failed.join(', ') },
        );
        if (copied.length) toast.warning(title, { id: toastId, description });
        else toast.error(title, { id: toastId, description });
      }
    } finally {
      busy.current = false;
    }
  };
  return {
    target,
    copyTo,
    clearFolder: () => setFolder(null),
    selectFolder: (path: string) => setFolder({ scopeId, path }),
    folderTarget: (path: string) => getFolderCopyTarget(roots, path),
    repositoryTarget: (id: string) => getRepositoryCopyTarget(roots, id),
  };
};

export const SkillTransferContext = createContext<ReturnType<
  typeof useSkillTransferController
> | null>(null);
export const useSkillTransfer = () => useContext(SkillTransferContext);

export const useSkillClipboard = (skills: Skill[]) => {
  const transfer = useSkillTransfer();
  const { t } = useI18n();
  useEffect(() => {
    const onCopy = (event: ClipboardEvent) => {
      if (
        !transfer ||
        isTextEditing(event.target) ||
        window.getSelection()?.toString() ||
        !skills.length ||
        !event.clipboardData
      )
        return;
      const payload = createSkillTransfer(skills);
      if (!payload) {
        event.preventDefault();
        toast.error(
          t(
            'Select existing skill folders to copy. Restore archived files first.',
          ),
        );
        return;
      }
      try {
        event.clipboardData.clearData();
        writeSkillTransfer(event.clipboardData, payload);
        event.preventDefault();
        toast.success(
          t(
            payload.skills.length === 1
              ? 'Skill copied to clipboard'
              : '{count} skills copied to clipboard',
            {
              count: payload.skills.length,
            },
          ),
          {
            description: t(
              'Select a project or folder, then paste to copy the skills there.',
            ),
          },
        );
      } catch {
        toast.error(t('Couldn’t copy skills to the clipboard.'));
      }
    };
    const onPaste = (event: ClipboardEvent) => {
      if (
        !transfer ||
        isTextEditing(event.target) ||
        !hasSkillTransfer(event.clipboardData)
      )
        return;
      event.preventDefault();
      const payload = readSkillTransfer(event.clipboardData);
      if (payload) void transfer.copyTo(payload, transfer.target);
      else toast.error(t('This Rig clipboard data is invalid or unsupported.'));
    };
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    return () => {
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
    };
  }, [skills, transfer, t]);
};

export const useSkillDropTarget = (target: SkillCopyTarget | null) => {
  const transfer = useSkillTransfer();
  const { t } = useI18n();
  const [isDragOver, setDragOver] = useState(false);
  const accepts = (event: DragEvent) =>
    !!transfer && !!target && hasSkillTransfer(event.dataTransfer);
  return {
    isDragOver,
    dropHandlers: {
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (!accepts(event)) return;
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
        setDragOver(true);
      },
      onDragLeave: (event: DragEvent<HTMLElement>) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        )
          setDragOver(false);
      },
      onDragEnd: () => setDragOver(false),
      onDropCapture: () => setDragOver(false),
      onDrop: (event: DragEvent<HTMLElement>) => {
        setDragOver(false);
        if (!accepts(event)) return;
        event.preventDefault();
        event.stopPropagation();
        const payload = readSkillTransfer(event.dataTransfer);
        if (payload) void transfer!.copyTo(payload, target);
        else
          toast.error(t('This Rig clipboard data is invalid or unsupported.'));
      },
    },
  };
};
