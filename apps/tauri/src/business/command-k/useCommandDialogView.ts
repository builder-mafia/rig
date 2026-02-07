import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CommandPaneId } from '../command-palette/types';
import { CommandPaletteManager } from './CommandPaletteManager';

type CommandDialogViewState<
  T extends Record<string, unknown> = Record<string, unknown>,
> = {
  isOpen: boolean;
  props: T | undefined;
};

export function useCommandDialogView<
  T extends Record<string, unknown> = Record<string, unknown>,
>(viewId: CommandPaneId): CommandDialogViewState<T> {
  const [state, setState] = useState<CommandDialogViewState<T>>({
    isOpen: false,
    props: undefined,
  });

  const commandPaletteManager = useMemo(
    () => CommandPaletteManager.getInstance(),
    [],
  );

  useEffect(() => {
    const subscription = commandPaletteManager
      .getViewState$()
      .subscribe(viewState => {
        setState({
          isOpen: viewState.paneId === viewId,
          props:
            viewState.paneId === viewId
              ? (viewState.paneProps as T)
              : undefined,
        });
      });

    return () => subscription.unsubscribe();
  }, [viewId, commandPaletteManager]);

  return state;
}

export function useCommandDialog() {
  const commandPaletteManager = useMemo(
    () => CommandPaletteManager.getInstance(),
    [],
  );

  const navigate = useCallback(
    (viewId: CommandPaneId, props?: Record<string, unknown>) => {
      commandPaletteManager.open(viewId, props);
    },
    [commandPaletteManager],
  );
  const close = useCallback(
    () => commandPaletteManager.close(),
    [commandPaletteManager],
  );

  return { navigate, close };
}
