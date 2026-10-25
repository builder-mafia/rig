import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Switch,
  toast,
} from '@allin/ui';
import { SkillProviderIcon } from '@/features/skills/components/SkillProviderIcon';
import {
  SKILL_SOURCES,
  type SkillSourceId,
} from '@/features/skills/skillSources';
import { usePreferences, type Language, type Theme } from '@/lib/preferences';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hiddenSkillSourceIds: ReadonlySet<SkillSourceId>;
  onSkillSourceVisibilityChange: (
    sourceId: SkillSourceId,
    isVisible: boolean,
  ) => boolean;
}

export const SettingsDialog = ({
  open,
  onOpenChange,
  hiddenSkillSourceIds,
  onSkillSourceVisibilityChange,
}: SettingsDialogProps) => {
  const { t, language, theme, setPreferences } = usePreferences();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel={t('Close')}
        className='gap-0 max-h-[85dvh] overflow-y-auto rounded-xl p-0 sm:max-w-md'
      >
        <DialogHeader className='px-5 pb-4 pt-5 text-left'>
          <DialogTitle className='text-base'>{t('Settings')}</DialogTitle>
          <DialogDescription className='text-xs leading-5'>
            {t('Language and appearance')}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 border-t border-border/60 px-5 py-4'>
          <div className='flex items-center justify-between gap-4'>
            <label htmlFor='rig-language' className='text-sm'>
              {t('Language')}
            </label>
            <select
              id='rig-language'
              value={language}
              onChange={event =>
                setPreferences({ language: event.target.value as Language })
              }
              className='h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'
            >
              <option value='system'>{t('System')}</option>
              <option value='ko' lang='ko'>
                한국어
              </option>
              <option value='en' lang='en'>
                English
              </option>
            </select>
          </div>
          <div className='flex items-center justify-between gap-4'>
            <label htmlFor='rig-theme' className='text-sm'>
              {t('Appearance')}
            </label>
            <select
              id='rig-theme'
              value={theme}
              onChange={event =>
                setPreferences({ theme: event.target.value as Theme })
              }
              className='h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'
            >
              <option value='system'>{t('System')}</option>
              <option value='light'>{t('Light')}</option>
              <option value='dark'>{t('Dark')}</option>
            </select>
          </div>
        </div>
        <div className='border-t border-border/60 px-5 pb-2'>
          <h2 className='pt-4 text-sm font-medium'>{t('Skill sources')}</h2>
          <p className='mt-1 text-xs leading-5 text-muted-foreground'>
            {t(
              'Choose which sources appear in Rig. Files and agent access stay unchanged.',
            )}
          </p>
          {SKILL_SOURCES.map(source => (
            <div
              key={source.id}
              className='flex items-center gap-3 border-b border-border/50 py-3 last:border-0'
            >
              <SkillProviderIcon sourceId={source.id} size={18} />
              <label htmlFor={`source-${source.id}`} className='flex-1 text-sm'>
                {source.name}
              </label>
              <Switch
                id={`source-${source.id}`}
                checked={!hiddenSkillSourceIds.has(source.id)}
                onCheckedChange={visible => {
                  if (!onSkillSourceVisibilityChange(source.id, visible))
                    toast.error(t('Couldn’t save skill sources. Try again.'));
                }}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
