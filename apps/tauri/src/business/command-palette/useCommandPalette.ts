import { useCallback, useSyncExternalStore } from 'react';
import { useService } from '@/business/ServiceContext';
import type { CommandPaneId } from './types';

export const useCommandPalette = () => {
  const { commandPaletteManager } = useService();

  const navigate = useCallback(
    (paneId: CommandPaneId, props?: Record<string, unknown>) => {
      commandPaletteManager.open(paneId, props);
    },
    [commandPaletteManager],
  );

  const close = useCallback(() => {
    commandPaletteManager.close();
  }, [commandPaletteManager]);

  const currentPane = useSyncExternalStore(
    (onChange: () => void) => {
      const subscription =
        commandPaletteManager.currentPane$.subscribe(onChange);
      return () => subscription.unsubscribe();
    },
    () => commandPaletteManager.getCurrentViewState(),
    () => commandPaletteManager.getCurrentViewState(),
  );

  return { currentPane, navigate, close };
};
