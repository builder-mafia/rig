import { useMemo } from 'react';
import type { Observable } from 'rxjs';
import type { HotkeyEvent } from './HotkeyManager';
import { hotkeyManager } from './HotkeyManager';

export const useHotKey = (combo: string): Observable<HotkeyEvent> => {
  return useMemo(() => hotkeyManager.on(combo), [combo]);
};
