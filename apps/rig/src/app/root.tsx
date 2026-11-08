import { useI18n } from '@/lib/preferences';
import { Button, cn } from '@allin/ui';
import { Settings, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { SettingsDialog } from '@/features/plugins/components/SettingsDialog';
import { SkillRoot } from '@/features/skills/components/SkillRoot';
import { useSkillSourceVisibility } from '@/features/skills/skillSources';
import { useSkillRoots } from '@/features/skills/useSkillRoots';
import { HeaderLayout } from '@/layouts/HeaderLayout';

const ConfigHub = dynamic(() =>
  import('@/features/configs/components/ConfigHub').then(
    module => module.ConfigHub,
  ),
);

export const Root = () => {
  const { t } = useI18n();
  const [pane, setPane] = useState<'skills' | 'configs'>('skills');
  const [editingConfig, setEditingConfig] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { hiddenSourceIds, setSourceVisible } = useSkillSourceVisibility();
  const { data: roots = [] } = useSkillRoots();
  const globalRoots = useMemo(
    () => roots.filter(root => root.scopeKind === 'global'),
    [roots],
  );
  return (
    <main className='rig-shell flex h-dvh flex-col overflow-hidden bg-background text-foreground'>
      <HeaderLayout>
        <div className='flex w-full items-center gap-2 px-3 sm:px-4'>
          <nav
            aria-label={t('Workspace')}
            className='flex items-center gap-1 rounded-lg bg-muted/60 p-1'
          >
            {(
              [
                ['skills', 'Skills', Sparkles],
                ['configs', 'Config Hub', SlidersHorizontal],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type='button'
                aria-current={pane === id ? 'page' : undefined}
                disabled={editingConfig && pane !== id}
                onClick={() => setPane(id)}
                className={cn(
                  'inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
                  pane === id
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon size={14} />
                <span>{t(label)}</span>
              </button>
            ))}
          </nav>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label={t('Open settings')}
            onClick={() => setIsSettingsOpen(true)}
            className='ml-auto size-8 rounded-md text-muted-foreground'
          >
            <Settings size={16} />
          </Button>
        </div>
      </HeaderLayout>
      {pane === 'skills' ? (
        <SkillRoot roots={globalRoots} hiddenSkillSourceIds={hiddenSourceIds} />
      ) : (
        <ConfigHub editing={editingConfig} onEditingChange={setEditingConfig} />
      )}
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        hiddenSkillSourceIds={hiddenSourceIds}
        onSkillSourceVisibilityChange={setSourceVisible}
      />
    </main>
  );
};
