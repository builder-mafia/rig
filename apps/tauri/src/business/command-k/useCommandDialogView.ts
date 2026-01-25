import { useCallback, useEffect, useState } from 'react';
import { commandDialogManager } from './CommandDialogManager';
import type { CommandViewId } from './types';

type CommandDialogViewState<
  T extends Record<string, unknown> = Record<string, unknown>,
> = {
  isOpen: boolean;
  props: T | undefined;
};

export function useCommandDialogView<
  T extends Record<string, unknown> = Record<string, unknown>,
>(viewId: CommandViewId): CommandDialogViewState<T> {
  const [state, setState] = useState<CommandDialogViewState<T>>({
    isOpen: false,
    props: undefined,
  });

  useEffect(() => {
    const subscription = commandDialogManager
      .getViewState$()
      .subscribe(viewState => {
        setState({
          isOpen: viewState.viewId === viewId,
          props:
            viewState.viewId === viewId ? (viewState.props as T) : undefined,
        });
      });

    return () => subscription.unsubscribe();
  }, [viewId]);

  return state;
}

export function useCommandDialog() {
  const navigate = useCallback(
    (viewId: CommandViewId, props?: Record<string, unknown>) => {
      commandDialogManager.open(viewId, props);
    },
    [],
  );
  const close = useCallback(() => commandDialogManager.close(), []);

  return { navigate, close };
}
