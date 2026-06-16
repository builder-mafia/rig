import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '@allin/ui';
import {
  CheckCircle2,
  ExternalLink,
  PlugZap,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import type { PluginTarget, PluginToolId } from '../types';

interface PluginSetupDialogProps {
  open: boolean;
  pluginTargets: PluginTarget[];
  onOpenChange: (open: boolean) => void;
  onInstallPlugin: (pluginId: PluginToolId) => void;
  onCheckAgain: () => void;
  isChecking: boolean;
  isInstalling: boolean;
  installingPluginId: PluginToolId | null;
  errorMessage: string | null;
}

export const PluginSetupDialog = ({
  open,
  pluginTargets,
  onOpenChange,
  onInstallPlugin,
  onCheckAgain,
  isChecking,
  isInstalling,
  installingPluginId,
  errorMessage,
}: PluginSetupDialogProps) => {
  const installedCount = pluginTargets.filter(
    target => target.isInstalled,
  ).length;
  const isComplete = installedCount === pluginTargets.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='w-[calc(100vw-2rem)] max-w-5xl'>
        <DialogHeader>
          <DialogTitle className='text-lg font-semibold'>
            Install plugin to track your usage
          </DialogTitle>
        </DialogHeader>
        <div className='flex flex-col gap-4 rounded-2xl bg-muted/30'>
          {errorMessage ? (
            <p className='mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'>
              {errorMessage}
            </p>
          ) : null}

          {isChecking && pluginTargets.length === 0 ? (
            <div className='space-y-3'>
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className='h-28 animate-pulse rounded-2xl border bg-background'
                />
              ))}
            </div>
          ) : (
            <div className='space-y-3'>
              {pluginTargets.map(target => (
                <PluginTargetRow
                  key={target.id}
                  target={target}
                  onInstallPlugin={onInstallPlugin}
                  isInstalling={
                    isInstalling && installingPluginId === target.id
                  }
                  isAnyInstalling={isInstalling}
                />
              ))}
            </div>
          )}
        </div>

        <a
          href={'https://www.allin.sh/docs/getting-started'}
          target='_blank'
          rel='noreferrer'
          className='inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        >
          <ExternalLink size={16} />
          Manual install
        </a>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            {isComplete ? 'Close' : 'Maybe later'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface PluginTargetRowProps {
  target: PluginTarget;
  onInstallPlugin: (pluginId: PluginToolId) => void;
  isInstalling: boolean;
  isAnyInstalling: boolean;
}

const PluginTargetRow = ({
  target,
  onInstallPlugin,
  isInstalling,
  isAnyInstalling,
}: PluginTargetRowProps) => {
  return (
    <div className='flex flex-col gap-4 rounded-2xl border bg-background p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between'>
      <div className='flex min-w-0 flex-1 items-center gap-4'>
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h3 className='text-base font-semibold leading-6'>{target.name}</h3>
          </div>
        </div>
      </div>

      <div className='flex shrink-0 flex-col gap-2 lg:items-center'>
        <Button
          type='button'
          className='w-full'
          variant={target.isInstalled ? 'outline' : 'default'}
          disabled={target.isInstalled || isAnyInstalling}
          onClick={() => onInstallPlugin(target.id)}
        >
          {getInstallButtonIcon(target, isInstalling)}
          {getInstallButtonLabel(target, isInstalling)}
        </Button>
      </div>
    </div>
  );
};

const getManualInstallUrl = (target: PluginTarget) => {
  switch (target.id) {
    case 'claude-code':
      return 'https://www.allin.sh/docs/getting-started#claude-code';
    case 'opencode':
      return 'https://www.allin.sh/docs/getting-started#opencode';
  }
};

const getInstallButtonIcon = (target: PluginTarget, isInstalling: boolean) => {
  if (isInstalling) {
    return <Spinner />;
  }

  return target.isInstalled ? (
    <CheckCircle2 size={16} />
  ) : (
    <PlugZap size={16} />
  );
};

const getInstallButtonLabel = (target: PluginTarget, isInstalling: boolean) => {
  if (isInstalling) {
    return 'Installing...';
  }

  if (target.isInstalled) {
    return 'Installed';
  }

  return 'Install plugin';
};
