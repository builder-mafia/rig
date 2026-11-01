import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { toast, Tooltip, TooltipContent, TooltipTrigger } from '@allin/ui';
import Image from 'next/image';
import { useI18n } from '@/lib/preferences';
import type { Skill } from '../types';

export type SkillEditor = 'cursor' | 'finder' | 'vscode' | 'webstorm' | 'zed';
const labels: Record<SkillEditor, string> = {
  cursor: 'Cursor',
  finder: 'Finder',
  vscode: 'VSCode',
  webstorm: 'WebStorm',
  zed: 'Zed',
};
const editorImages = {
  cursor: '/application_icon/cursor-dashboard.svg',
  finder: '/application_icon/finder.png',
  zed: '/application_icon/zed-dashboard.svg',
};
const EditorIcon = ({ editor }: { editor: SkillEditor }) => {
  if (editor === 'cursor' || editor === 'finder' || editor === 'zed') {
    const finder = editor === 'finder';
    return (
      <Image
        src={editorImages[editor]}
        alt=''
        aria-hidden='true'
        width={finder ? 24 : 20}
        height={finder ? 24 : 20}
        unoptimized
        draggable={false}
        className={finder ? 'object-contain' : 'object-contain dark:invert'}
      />
    );
  }
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      {editor === 'vscode' ? (
        <path
          d='m17 2 5 2v16l-5 2-11-9-4 3-2-1V9l2-1 4 3L17 2Zm0 5-8 5 8 5V7ZM2 10v4l2-2-2-2Z'
          fill='currentColor'
        />
      ) : (
        <>
          <rect x='2' y='2' width='20' height='20' rx='3' fill='currentColor' />
          <path
            d='m5 7 1.5 6L8 9l1.5 4L11 7m7 1c-4-2-6 2-2 2s3 5-1 3M5 18h7'
            stroke='var(--background)'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </>
      )}
    </svg>
  );
};
export const SkillEditorActions = ({
  skill,
  beforeOpen,
}: {
  skill: Skill;
  beforeOpen: () => Promise<boolean>;
}) => {
  const { t } = useI18n();
  const [opening, setOpening] = useState<SkillEditor | null>(null);
  const query = useQuery<SkillEditor[]>({
    queryKey: ['installed-skill-editors'],
    queryFn: () => invoke('list_skill_editors'),
    staleTime: 30_000,
  });
  const open = async (editor: SkillEditor) => {
    if (opening) return;
    setOpening(editor);
    try {
      if (editor !== 'finder' && !(await beforeOpen())) return;
      await invoke('open_skill_in_editor', {
        rootPath: skill.rootPath,
        relativePath: skill.relativePath,
        editor,
      });
    } catch {
      toast.error(t('Couldn’t open {app}.', { app: labels[editor] }), {
        position: 'top-center',
      });
      void query.refetch();
    } finally {
      setOpening(null);
    }
  };
  // Only IDs returned by native installation discovery become launch buttons.
  return (
    <>
      {(Array.isArray(query.data) ? query.data : [])
        .filter(editor => editor in labels)
        .map(editor => (
          <Tooltip key={editor}>
            <TooltipTrigger asChild>
              <button
                type='button'
                aria-label={t('Open in {app}', { app: labels[editor] })}
                disabled={opening !== null}
                onClick={() => void open(editor)}
                className='inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40'
              >
                <EditorIcon editor={editor} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {t('Open in {app}', { app: labels[editor] })}
            </TooltipContent>
          </Tooltip>
        ))}
    </>
  );
};
