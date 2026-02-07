import { EMPTY, filter, fromEvent, map, type Observable, share } from 'rxjs';
import type { HotkeyEvent, IHotkeyManager } from './types';

const isMac =
  typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);

const normalizeCombo = (e: KeyboardEvent): string => {
  const parts: string[] = [];
  const hasModKey = isMac ? e.metaKey : e.ctrlKey;
  if (hasModKey) parts.push('mod');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');
  parts.push(e.key.toLowerCase());
  return parts.join('+');
};

const toHotkeyEvent = (e: KeyboardEvent): HotkeyEvent => {
  const target = (e.target as HTMLElement) ?? document.body;
  return {
    originalEvent: e,
    target,
    isInputContext:
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target.contentEditable === 'true',
  };
};

export class HotkeyManager implements IHotkeyManager {
  private static instance: HotkeyManager;
  private readonly keydown$: Observable<KeyboardEvent>;

  private constructor() {
    this.keydown$ =
      typeof document !== 'undefined'
        ? fromEvent<KeyboardEvent>(document, 'keydown').pipe(share())
        : EMPTY;
  }

  public static getInstance(): HotkeyManager {
    if (!HotkeyManager.instance) {
      HotkeyManager.instance = new HotkeyManager();
    }
    return HotkeyManager.instance;
  }

  public on(combo: string): Observable<HotkeyEvent> {
    return this.keydown$.pipe(
      filter(e => normalizeCombo(e) === combo),
      map(toHotkeyEvent),
    );
  }
}

export const hotkeyManager = HotkeyManager.getInstance();
