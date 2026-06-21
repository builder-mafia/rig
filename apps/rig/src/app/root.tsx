import { Button } from '@allin/ui';
import { PlugZap } from 'lucide-react';
import posthog from 'posthog-js';
import { appPaths, useAppNavigation } from '@/app/navigation';
import { DashboardRoot } from '@/features/dashboard/components/DashboardRoot';
import { PluginSetupDialog } from '@/features/plugins/components/PluginSetupDialog';
import { usePluginSetup } from '@/features/plugins/usePluginSetup';
import { RepositorySelector } from '@/features/skills/components/RepositorySelector';
import { SkillRoot } from '@/features/skills/components/SkillRoot';
import { useImportSkillRoot } from '@/features/skills/useImportSkillRoot';
import { useSkillRepositorySelection } from '@/features/skills/useSkillRepositorySelection';
import { useSkillRoots } from '@/features/skills/useSkillRoots';
import { HeaderLayout } from '@/layouts/HeaderLayout';

export const Root = () => {
  const navigation = useAppNavigation();
  const pluginSetup = usePluginSetup();

  const { data: roots = [] } = useSkillRoots();
  const repositorySelection = useSkillRepositorySelection({
    roots,
    onRepositoryChange: () => undefined,
  });
  const importSkillRoot = useImportSkillRoot({
    onImported: importedRoot =>
      repositorySelection.selectRepository(importedRoot.id),
  });
  const renderCurrentPath = () => {
    switch (navigation.currentPath) {
      case appPaths.skills:
        return (
          <SkillRoot
            key={repositorySelection.selectedRepositoryId}
            roots={repositorySelection.visibleRoots}
          />
        );
      case appPaths.dashboard:
        return <DashboardRoot roots={repositorySelection.visibleRoots} />;
    }
  };

  return (
    <main className='flex h-dvh flex-col overflow-hidden bg-background text-foreground'>
      <HeaderLayout>
        <div className='flex w-full items-center justify-between pr-4'>
          <RepositorySelector
            roots={roots}
            selectedRepositoryId={repositorySelection.selectedRepositoryId}
            isOpen={repositorySelection.isOpen}
            isImporting={importSkillRoot.isImporting}
            onOpenChange={repositorySelection.setIsOpen}
            onSelectRepository={repositorySelection.selectRepository}
            onImportRepository={importSkillRoot.importFromFolder}
          />
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={pluginSetup.openPluginSetup}
            >
              <PlugZap size={15} />
              Plugins
              {pluginSetup.hasIncompletePlugin && (
                <span className='ml-1 size-2 rounded-full bg-blue-500' />
              )}
            </Button>

            <div className='flex rounded-xl border bg-muted/40 p-1'>
              <ViewToggleButton
                label='Skills'
                isSelected={navigation.isCurrentPath(appPaths.skills)}
                onClick={() => navigation.navigate(appPaths.skills)}
              />
              <ViewToggleButton
                label='Dashboard'
                isSelected={navigation.isCurrentPath(appPaths.dashboard)}
                onClick={() => navigation.navigate(appPaths.dashboard)}
              />
            </div>
          </div>
        </div>
      </HeaderLayout>
      {renderCurrentPath()}
      <PluginSetupDialog
        open={pluginSetup.isOpen}
        pluginTargets={pluginSetup.pluginTargets}
        onOpenChange={pluginSetup.setIsOpen}
        onInstallPlugin={pluginSetup.installPlugin}
        onCheckAgain={pluginSetup.checkAgain}
        isChecking={pluginSetup.isChecking}
        isInstalling={pluginSetup.isInstalling}
        installingPluginId={pluginSetup.installingPluginId}
        errorMessage={pluginSetup.errorMessage}
      />
    </main>
  );
};

interface ViewToggleButtonProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

const ViewToggleButton = ({
  label,
  isSelected,
  onClick,
}: ViewToggleButtonProps) => {
  return (
    <button
      type='button'
      aria-pressed={isSelected}
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        isSelected
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
};
