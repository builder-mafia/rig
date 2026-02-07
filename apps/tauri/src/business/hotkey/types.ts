import type { Observable } from 'rxjs';

export type HotkeyEvent = {
  readonly originalEvent: KeyboardEvent;
  readonly target: HTMLElement;
  readonly isInputContext: boolean;
};

export interface IHotkeyManager {
  on(combo: string): Observable<HotkeyEvent>;
}
