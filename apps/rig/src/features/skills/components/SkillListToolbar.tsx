import { ArrowLeft, EyeOff, Search } from 'lucide-react';
import { memo } from 'react';
import { useI18n } from '@/lib/preferences';

export const SkillListToolbar = memo(function SkillListToolbar({
  showingHidden,
  hiddenCount,
  searchQuery,
  error,
  onToggleHidden,
  onSearchChange,
}: {
  showingHidden: boolean;
  hiddenCount: number;
  searchQuery: string;
  error: string | null;
  onToggleHidden: () => void;
  onSearchChange: (value: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className='shrink-0 space-y-2 border-b border-border/60 p-3'>
      {showingHidden ? (
        <div className='flex items-center gap-2 px-1 pb-1'>
          <button
            type='button'
            onClick={onToggleHidden}
            aria-label={t('Back to skills')}
            className='rounded p-1 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          >
            <ArrowLeft size={14} />
          </button>
          <h1 className='text-sm font-medium'>{t('Hidden')}</h1>
          <span className='ml-auto text-xs tabular-nums text-muted-foreground'>
            {hiddenCount}
          </span>
        </div>
      ) : null}
      <div className='flex items-center gap-2'>
        <label className='relative min-w-0 flex-1'>
          <Search
            size={14}
            aria-hidden='true'
            className='pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground'
          />
          <span className='sr-only'>{t('Search skills')}</span>
          <input
            type='search'
            autoCapitalize='none'
            autoCorrect='off'
            autoComplete='off'
            spellCheck={false}
            {...{ writingsuggestions: 'false' }}
            value={searchQuery}
            onChange={event => {
              onSearchChange(event.target.value);
            }}
            placeholder={t('Search skills…')}
            className='h-8 w-full rounded-md border border-border/70 bg-background pl-8 pr-2 text-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring'
          />
        </label>
        {!showingHidden ? (
          <button
            type='button'
            onClick={onToggleHidden}
            aria-label={t('Hidden skills ({count})', {
              count: hiddenCount,
            })}
            title={t('Hidden skills')}
            className='inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          >
            <EyeOff size={14} />
            <span className='tabular-nums'>{hiddenCount}</span>
          </button>
        ) : null}
      </div>
      {showingHidden ? (
        <p className='px-1 text-xs leading-5 text-muted-foreground'>
          {t(
            'Hidden only in Rig. Previously archived files can also be recovered here.',
          )}
        </p>
      ) : null}
      {error ? (
        <p role='alert' className='px-1 text-xs text-destructive'>
          {t('Some folders couldn’t be read:')}
          {error}
        </p>
      ) : null}
    </div>
  );
});
