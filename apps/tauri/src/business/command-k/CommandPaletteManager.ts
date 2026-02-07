import { BehaviorSubject, filter, fromEvent, type Observable } from 'rxjs';
import type { CommandPaneId, CommandPaneState } from '../command-palette/types';

export class CommandPaletteManager {
  private static instance: CommandPaletteManager;
  private currentPane$ = new BehaviorSubject<CommandPaneState>({
    paneId: null,
  });
  private isKeyboardShortcutSetup = false;

  private constructor() {
    this.setupKeyboardShortcut();
  }

  public static getInstance(): CommandPaletteManager {
    if (!CommandPaletteManager.instance) {
      CommandPaletteManager.instance = new CommandPaletteManager();
    }
    return CommandPaletteManager.instance;
  }

  public getViewState$(): Observable<CommandPaneState> {
    return this.currentPane$.asObservable();
  }

  public getCurrentViewState(): CommandPaneState {
    return this.currentPane$.getValue();
  }

  public open(viewId: CommandPaneId, props?: Record<string, unknown>): void {
    this.currentPane$.next({ paneId: viewId, paneProps: props });
  }

  public close(): void {
    this.currentPane$.next({ paneId: null });
  }

  private setupKeyboardShortcut(): void {
    if (typeof document === 'undefined' || this.isKeyboardShortcutSetup) return;

    this.isKeyboardShortcutSetup = true;

    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        filter(e => e.key === 'j' && (e.metaKey || e.ctrlKey)),
        filter(() => this.currentPane$.getValue().paneId === null),
      )
      .subscribe(e => {
        e.preventDefault();
        this.open('home');
      });
  }
}

export const commandDialogManager = CommandPaletteManager.getInstance();
