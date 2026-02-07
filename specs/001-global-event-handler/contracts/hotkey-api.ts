import type { Observable } from 'rxjs';

export type HotkeyEvent = {
  readonly originalEvent: KeyboardEvent;
  readonly target: HTMLElement;
  readonly isInputContext: boolean;
};

export interface IHotkeyManager {
  /**
   * @param combo - Normalized combo string (e.g., 'mod+j', 'mod+shift+p')
   * @returns Filtered stream that emits HotkeyEvent when combo is pressed
   * @example
   * hotkeyManager.on('mod+j').subscribe(e => {
   *   if (!e.isInputContext) {
   *     e.originalEvent.preventDefault();
   *     openCommandPalette();
   *   }
   * });
   */
  on(combo: string): Observable<HotkeyEvent>;
}

/**
 * @param combo - Key combination string (e.g., 'mod+j')
 * @returns Stable Observable<HotkeyEvent> memoized by combo string
 * @throws Error when called outside HotKeyProvider
 * @example
 * const hotkey$ = useHotKey('mod+k');
 * useEffect(() => {
 *   const sub = hotkey$
 *     .pipe(filter(e => !e.isInputContext))
 *     .subscribe(() => doSomething());
 *   return () => sub.unsubscribe();
 * }, [hotkey$]);
 */
export type UseHotKey = (combo: string) => Observable<HotkeyEvent>;
