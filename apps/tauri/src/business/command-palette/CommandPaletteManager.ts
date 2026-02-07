import { BehaviorSubject, type Observable } from 'rxjs';
import type { CommandPaneId, CommandPaneState } from './types';

export class CommandPaletteManager {
  private static instance: CommandPaletteManager;
  private _currentPane$ = new BehaviorSubject<CommandPaneState>({
    paneId: null,
  });

  private constructor() {}

  public static getInstance(): CommandPaletteManager {
    if (!CommandPaletteManager.instance) {
      CommandPaletteManager.instance = new CommandPaletteManager();
    }
    return CommandPaletteManager.instance;
  }

  public get currentPane$(): Observable<CommandPaneState> {
    return this._currentPane$.asObservable();
  }

  public getCurrentViewState(): CommandPaneState {
    return this._currentPane$.getValue();
  }

  public open(viewId: CommandPaneId, props?: Record<string, unknown>): void {
    this._currentPane$.next({ paneId: viewId, paneProps: props });
  }

  public close(): void {
    this._currentPane$.next({ paneId: null });
  }
}

export const commandDialogManager = CommandPaletteManager.getInstance();
