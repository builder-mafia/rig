import { useI18n } from '@/lib/preferences';
import { translate, type Locale, type Message } from '@/lib/translations';
import {
  Badge,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  toast,
} from '@allin/ui';
import {
  ArrowLeft,
  Clipboard,
  Eye,
  EyeOff,
  FileWarning,
  MoreHorizontal,
} from 'lucide-react';
import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { getSkillFilePath } from '../insights';
import { abbreviateHomePath } from '../skillTree';
import type { Skill } from '../types';
import { getSkillIdentity } from '../useRemoveSkill';
import { ShareSkillDialog } from './ShareSkillDialog';
import { SkillHistoryPanel } from './SkillHistoryPanel';

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
            {t('Browse folders or search to read its instructions.')}
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

type InspectorTab = 'rendered' | 'source' | 'history';
const tabs: { value: InspectorTab; label: Message }[] = [
  { value: 'rendered', label: 'Instructions' },
  { value: 'source', label: 'Source' },
  { value: 'history', label: 'History' },
];

const SkillInspector = ({
  skill,
  isHidden,
  hiddenFolderPath,
  onShowFolder,
  onBack,
  onHideSkill,
  onShowSkill,
  onRestoreArchivedSkill,
  isRestoring,
}: SkillContentViewerProps & { skill: Skill }) => {
  const { t, locale } = useI18n();

  const [activeTab, setActiveTab] = useState<InspectorTab>(
    skill.isValid ? 'rendered' : 'source',
  );
  const tabListRef = useRef<HTMLDivElement>(null);
  const path = getSkillFilePath(skill);
  const availableTabs = tabs.filter(
    tab => tab.value !== 'history' || !skill.isArchived,
  );
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
    <div className='flex h-full min-h-0 flex-col bg-background'>
      <header className='shrink-0 border-b border-border/60 px-6 pt-4'>
        <div className='mx-auto max-w-5xl'>
          <button
            type='button'
            onClick={onBack}
            className='mb-2 -ml-2 inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden'
          >
            <ArrowLeft size={14} />
            {t('Skills')}
          </button>
          <div className='flex min-w-0 items-start gap-3'>
            <div className='min-w-0 flex-1'>
              <div className='flex min-w-0 items-center gap-2'>
                <h1 className='truncate text-base font-semibold tracking-[-0.02em]'>
                  {skill.name}
                </h1>
                {!skill.isValid ? (
                  <Badge variant='destructive'>{t('Invalid')}</Badge>
                ) : null}
                {isHidden && !skill.isArchived ? (
                  <span className='text-xs text-muted-foreground'>
                    {t('Hidden')}
                  </span>
                ) : null}
              </div>
              <p className='mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground'>
                {skill.description || t('No description provided.')}
              </p>
            </div>
            <div className='flex shrink-0 items-center gap-1'>
              <ShareSkillDialog skill={skill} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type='button'
                    aria-label={t('More skill actions')}
                    className='inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
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
                  {!skill.isArchived ? (
                    <>
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
          <div className='mt-3 flex items-end justify-between gap-3'>
            <div
              ref={tabListRef}
              role='tablist'
              aria-label={t('Skill content view')}
              className='flex gap-5'
              onKeyDown={event => {
                const enabledTabs = availableTabs.filter(
                  tab => skill.isValid || tab.value !== 'rendered',
                );
                const index = enabledTabs.findIndex(
                  tab => tab.value === activeTab,
                );
                const next =
                  event.key === 'ArrowRight'
                    ? (index + 1) % enabledTabs.length
                    : event.key === 'ArrowLeft'
                      ? (index + enabledTabs.length - 1) % enabledTabs.length
                      : event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? enabledTabs.length - 1
                          : -1;
                if (next < 0) return;
                event.preventDefault();
                const value = enabledTabs[next].value;
                setActiveTab(value);
                tabListRef.current
                  ?.querySelector<HTMLButtonElement>(`[data-tab="${value}"]`)
                  ?.focus();
              }}
            >
              {availableTabs.map(tab => (
                <button
                  key={tab.value}
                  id={`skill-tab-${tab.value}`}
                  type='button'
                  role='tab'
                  data-tab={tab.value}
                  aria-controls='skill-content-panel'
                  aria-selected={activeTab === tab.value}
                  tabIndex={activeTab === tab.value ? 0 : -1}
                  disabled={tab.value === 'rendered' && !skill.isValid}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    'h-9 border-b text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40',
                    activeTab === tab.value
                      ? 'border-foreground text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(tab.label)}
                </button>
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type='button'
                  aria-label={t('Show skill details')}
                  className='mb-1 h-7 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                >
                  {t('Details')}
                </button>
              </PopoverTrigger>
              <PopoverContent
                align='end'
                className='skill-details-popover w-[min(360px,calc(100vw-2rem))] p-3'
              >
                <dl className='grid grid-cols-[60px_minmax(0,1fr)] gap-3 text-xs'>
                  <dt className='text-muted-foreground'>{t('Location')}</dt>
                  <dd>
                    <button
                      type='button'
                      onClick={() => void copy(path, 'path')}
                      title={path}
                      className='w-full break-all rounded text-left font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
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
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>
      <ScrollArea className='min-h-0 flex-1'>
        <div className='mx-auto w-full max-w-5xl px-6 py-5'>
          {skill.isArchived ? (
            <div className='mb-5 rounded-md border border-border/60 p-3 text-xs leading-5'>
              <p>
                {t(
                  'This file was moved to an archive by an earlier version of Rig. Restore it to its original folder to make it available to agents again.',
                )}
              </p>
              <button
                type='button'
                disabled={isRestoring}
                onClick={() => onRestoreArchivedSkill(skill)}
                className='mt-2 rounded border px-2 py-1 font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50'
              >
                {isRestoring ? t('Restoring…') : t('Restore file')}
              </button>
            </div>
          ) : null}
          {skill.validationError ? (
            <div className='mb-5 flex items-start gap-2 rounded-md bg-destructive/5 p-3 text-sm text-destructive'>
              <FileWarning size={16} className='mt-0.5 shrink-0' />
              <p>{skill.validationError.message}</p>
            </div>
          ) : null}
          <section
            id='skill-content-panel'
            role='tabpanel'
            aria-labelledby={`skill-tab-${activeTab}`}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: Tab panels need a keyboard focus target.
            tabIndex={0}
            className='outline-none focus-visible:ring-2 focus-visible:ring-ring'
          >
            {activeTab === 'rendered' ? (
              <SkillMarkdown content={skill.content} />
            ) : activeTab === 'source' ? (
              <pre className='overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-muted/35 p-4 font-mono text-[13px] leading-6'>
                <code>
                  {skill.content || t('This skill has no readable content.')}
                </code>
              </pre>
            ) : (
              <SkillHistoryPanel skill={skill} />
            )}
          </section>
        </div>
      </ScrollArea>
    </div>
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
