import { BehaviorSubject, filter, fromEvent, type Observable } from 'rxjs';
import type { CommandViewId, CommandViewState } from './types';

export class CommandDialogManager {
  private static instance: CommandDialogManager;
  private currentView$ = new BehaviorSubject<CommandViewState>({
    viewId: null,
  });
  private isKeyboardShortcutSetup = false;

  private constructor() {
    this.setupKeyboardShortcut();
  }

  public static getInstance(): CommandDialogManager {
    if (!CommandDialogManager.instance) {
      CommandDialogManager.instance = new CommandDialogManager();
    }
    return CommandDialogManager.instance;
  }

  public getViewState$(): Observable<CommandViewState> {
    return this.currentView$.asObservable();
  }

  public getCurrentViewState(): CommandViewState {
    return this.currentView$.getValue();
  }

  public open(viewId: CommandViewId, props?: Record<string, unknown>): void {
    this.currentView$.next({ viewId, props });
  }

  public close(): void {
    this.currentView$.next({ viewId: null });
  }

  private setupKeyboardShortcut(): void {
    if (typeof document === 'undefined' || this.isKeyboardShortcutSetup) return;

    this.isKeyboardShortcutSetup = true;

    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        filter(e => e.key === 'j' && (e.metaKey || e.ctrlKey)),
        filter(() => this.currentView$.getValue().viewId === null),
      )
      .subscribe(e => {
        e.preventDefault();
        this.open('home');
      });
  }
}

export const commandDialogManager = CommandDialogManager.getInstance();
