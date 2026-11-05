import { useI18n } from '@/lib/preferences';
import { translate, type Locale } from '@/lib/translations';
import {
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  toast,
} from '@allin/ui';
import {
  ArrowLeft,
  Clipboard,
  Eye,
  EyeOff,
  History,
  Info,
  MoreHorizontal,
} from 'lucide-react';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { getSkillFilePath } from '../insights';
import { abbreviateHomePath } from '../skillTree';
import type { Skill } from '../types';
import type { SkillContentViewerProps } from './SkillContentViewer';
import { ShareSkillButton } from './ShareSkillDialog';
import { SkillEditorActions } from './SkillEditorActions';

const SkillHistoryPanel = dynamic(() =>
  import('./SkillHistoryPanel').then(module => module.SkillHistoryPanel),
);

export const SkillHeader = ({
  skill,
  isHidden,
  hiddenFolderPath,
  onShowFolder,
  onBack,
  onHideSkill,
  onShowSkill,
  beforeOpen,
  shareAction,
  status,
}: SkillContentViewerProps & {
  skill: Skill;
  beforeOpen: () => Promise<boolean>;
  shareAction?: React.ReactNode;
  status?: React.ReactNode;
}) => {
  const { t, locale } = useI18n();
  const [panel, setPanel] = useState<'history' | 'details' | null>(null);
  const path = getSkillFilePath(skill);
  const copy = async (value: string, kind: 'instructions' | 'path') => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(
        t(kind === 'instructions' ? 'Instructions copied' : 'File path copied'),
      );
    } catch {
      toast.error(
        t(
          kind === 'instructions'
            ? 'Couldn’t copy instructions.'
            : 'Couldn’t copy file path.',
        ),
      );
    }
  };
  return (
    <>
      <header className='shrink-0 border-b border-border/60 px-4 py-3 sm:px-6'>
        <div className='flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2'>
          <button
            type='button'
            onClick={onBack}
            aria-label={t('Skills')}
            className='inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted md:hidden'
          >
            <ArrowLeft size={16} />
          </button>
          <h1
            className='min-w-0 flex-1 truncate text-base font-semibold tracking-[-0.02em]'
            title={skill.name}
          >
            {skill.name}
          </h1>
          {!skill.isValid ? (
            <Badge variant='destructive'>{t('Invalid')}</Badge>
          ) : null}
          {isHidden && !skill.isArchived ? (
            <span className='text-xs text-muted-foreground'>{t('Hidden')}</span>
          ) : null}
          {status}
          <div className='ml-auto flex items-center gap-0.5'>
            {shareAction ?? <ShareSkillButton skill={skill} />}
            {!skill.isArchived ? (
              <SkillEditorActions skill={skill} beforeOpen={beforeOpen} />
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type='button'
                  aria-label={t('More skill actions')}
                  className='inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                >
                  <MoreHorizontal size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-48'>
                <DropdownMenuItem
                  onSelect={() => void copy(skill.content, 'instructions')}
                >
                  <Clipboard />
                  {t('Copy instructions')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void copy(path, 'path')}>
                  <Clipboard />
                  {t('Copy file path')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setPanel('details')}>
                  <Info />
                  {t('Details')}
                </DropdownMenuItem>
                {!skill.isArchived ? (
                  <>
                    <DropdownMenuItem onSelect={() => setPanel('history')}>
                      <History />
                      {t('History')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      title={hiddenFolderPath}
                      onSelect={() =>
                        hiddenFolderPath && onShowFolder
                          ? onShowFolder(hiddenFolderPath)
                          : isHidden
                            ? onShowSkill(skill)
                            : onHideSkill(skill)
                      }
                    >
                      {isHidden ? <Eye /> : <EyeOff />}
                      {hiddenFolderPath
                        ? t('Show containing folder in Rig')
                        : isHidden
                          ? t('Show in Rig')
                          : t('Hide from Rig')}
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <Dialog
        open={panel !== null}
        onOpenChange={open => {
          if (!open) setPanel(null);
        }}
      >
        <DialogContent
          className={
            panel === 'history'
              ? 'max-h-[85vh] overflow-y-auto sm:max-w-5xl'
              : 'sm:max-w-md'
          }
        >
          <DialogHeader>
            <DialogTitle>
              {t(panel === 'history' ? 'History' : 'Details')}
            </DialogTitle>
          </DialogHeader>
          {panel === 'history' ? (
            <SkillHistoryPanel skill={skill} />
          ) : panel === 'details' ? (
            <dl className='grid grid-cols-[60px_minmax(0,1fr)] gap-3 text-xs'>
              <dt className='text-muted-foreground'>{t('Location')}</dt>
              <dd>
                <button
                  type='button'
                  onClick={() => void copy(path, 'path')}
                  title={path}
                  className='w-full break-all rounded text-left font-mono'
                >
                  {abbreviateHomePath(path)}
                </button>
              </dd>
              {skill.updatedAt ? (
                <>
                  <dt className='text-muted-foreground'>{t('Modified')}</dt>
                  <dd>{formatRelativeTime(skill.updatedAt, locale)}</dd>
                </>
              ) : null}
            </dl>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

const formatRelativeTime = (value: string, locale: Locale) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1_000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];

  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) {
      return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
        Math.round(diffSeconds / seconds),
        unit,
      );
    }
  }

  return translate(locale)('just now');
};
