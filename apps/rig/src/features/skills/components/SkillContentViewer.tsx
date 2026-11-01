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
import ReactMarkdown from 'react-markdown';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { getSkillFilePath } from '../insights';
import { abbreviateHomePath } from '../skillTree';
import type { Skill } from '../types';
import { getSkillIdentity } from '../useRemoveSkill';
import { useSkillDocument } from '../useSkillDocument';
import { ShareSkillButton } from './ShareSkillDialog';
import { SkillHistoryPanel } from './SkillHistoryPanel';
import { SkillEditorActions } from './SkillEditorActions';

interface SkillContentViewerProps {
  skill: Skill | null;
  isHidden: boolean;
  hiddenFolderPath?: string;
  onShowFolder?: (path: string) => void;
  onBack: () => void;
  onHideSkill: (skill: Skill) => void;
  onShowSkill: (skill: Skill) => void;
  onRestoreArchivedSkill: (skill: Skill) => void;
  isRestoring: boolean;
}

export const SkillContentViewer = (props: SkillContentViewerProps) => {
  const { t } = useI18n();
  if (!props.skill)
    return (
      <div className='flex h-full items-center justify-center px-8'>
        <div className='text-center'>
          <h1 className='text-base font-medium'>{t('Select a skill')}</h1>
          <p className='mt-1.5 text-sm text-muted-foreground'>
            {t('Select a skill to edit its file.')}
          </p>
        </div>
      </div>
    );
  return (
    <SkillInspector
      key={getSkillIdentity(props.skill)}
      {...props}
      skill={props.skill}
    />
  );
};

const SkillInspector = (props: SkillContentViewerProps & { skill: Skill }) => {
  // Archived skills are not loaded through the editable file API.
  return props.skill.isArchived ? (
    <ArchivedSkill {...props} />
  ) : (
    <EditableSkill {...props} />
  );
};

const EditableSkill = (props: SkillContentViewerProps & { skill: Skill }) => {
  const { skill } = props;
  const { t } = useI18n();
  const document = useSkillDocument(skill);
  const { session } = document;
  return (
    <div
      className='flex h-full min-h-0 flex-col bg-background'
      onKeyDown={event => {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === 's'
        ) {
          event.preventDefault();
          if (!event.nativeEvent.isComposing) void session.save();
        }
      }}
    >
      <SkillHeader
        {...props}
        beforeOpen={session.save}
        shareContent={document.content}
        shareDisabled={!document.saved}
        status={
          <span role='status' className='text-[11px] text-muted-foreground'>
            {document.saving
              ? t('Saving…')
              : document.dirty
                ? t('Unsaved changes')
                : ''}
          </span>
        }
      />
      {document.error ? (
        <div
          role='alert'
          className='flex flex-wrap items-center gap-3 border-b border-border/60 px-6 py-2 text-xs'
        >
          <span className='text-destructive'>
            {t(
              document.error === 'conflict'
                ? 'This file changed in another app. Your edits are kept here.'
                : document.error === 'load'
                  ? 'Couldn’t read this skill file.'
                  : 'Couldn’t save changes. Your edits are kept here.',
            )}
          </span>
          {document.error !== 'conflict' ? (
            <button
              type='button'
              className='underline underline-offset-4'
              onClick={() =>
                void (document.dirty ? session.save() : session.load())
              }
            >
              {t('Retry')}
            </button>
          ) : null}
          {document.dirty ? (
            <>
              <button
                type='button'
                className='underline underline-offset-4'
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(document.content);
                    toast.success(t('Edits copied'), {
                      position: 'top-center',
                    });
                  } catch {
                    toast.error(t('Couldn’t copy instructions.'));
                  }
                }}
              >
                {t('Copy my edits')}
              </button>
              <button
                type='button'
                className='underline underline-offset-4'
                onClick={() => void session.discardAndReload()}
              >
                {t('Discard edits and reload')}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
      {document.loading ? (
        <p className='px-6 py-5 text-sm text-muted-foreground'>
          {t('Loading file…')}
        </p>
      ) : (
        <textarea
          aria-label={t('Skill file content')}
          aria-describedby='skill-save-hint'
          value={document.content}
          disabled={!document.saved}
          onChange={event => session.change(event.target.value)}
          onCompositionStart={() => session.composition(true)}
          onCompositionEnd={() => session.composition(false)}
          autoCapitalize='off'
          autoCorrect='off'
          spellCheck={false}
          className='min-h-0 w-full flex-1 resize-none border-0 bg-transparent px-6 py-5 font-mono text-[13px] leading-6 text-foreground outline-none selection:bg-foreground/15 disabled:opacity-50'
        />
      )}
      <span id='skill-save-hint' className='sr-only'>
        {t(
          'Changes save automatically. Press Command or Control+S to save now.',
        )}
      </span>
    </div>
  );
};

const ArchivedSkill = (props: SkillContentViewerProps & { skill: Skill }) => {
  const { t } = useI18n();
  return (
    <div className='flex h-full min-h-0 flex-col bg-background'>
      <SkillHeader {...props} beforeOpen={async () => false} />
      <div className='border-b border-border/60 px-6 py-3 text-xs'>
        <p>{t('Restore this archived skill before editing.')}</p>
        <button
          type='button'
          disabled={props.isRestoring}
          onClick={() => props.onRestoreArchivedSkill(props.skill)}
          className='mt-2 rounded px-2 py-1 font-medium hover:bg-muted'
        >
          {props.isRestoring ? t('Restoring…') : t('Restore file')}
        </button>
      </div>
      <pre className='min-h-0 flex-1 overflow-auto whitespace-pre-wrap px-6 py-5 font-mono text-[13px] leading-6'>
        {props.skill.content}
      </pre>
    </div>
  );
};

const SkillHeader = ({
  skill,
  isHidden,
  hiddenFolderPath,
  onShowFolder,
  onBack,
  onHideSkill,
  onShowSkill,
  beforeOpen,
  shareContent,
  shareDisabled,
  status,
}: SkillContentViewerProps & {
  skill: Skill;
  beforeOpen: () => Promise<boolean>;
  shareContent?: string;
  shareDisabled?: boolean;
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
            <ShareSkillButton
              skill={skill}
              fileContent={shareContent}
              disabled={shareDisabled}
            />
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

export const SkillMarkdown = ({ content }: { content: string }) => (
  <article className='prose prose-neutral max-w-[76ch] dark:prose-invert prose-headings:tracking-[-0.02em] prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-pre:overflow-x-auto'>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        rehypeSanitize,
        [rehypeExternalLinks, { target: '_blank', rel: ['noreferrer'] }],
      ]}
    >
      {content}
    </ReactMarkdown>
  </article>
);

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
