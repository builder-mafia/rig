import { useMemo } from 'react';
import type { Observable } from 'rxjs';
import { hotkeyManager } from './HotkeyManager';
import type { HotkeyEvent } from './types';

export const useHotKey = (combo: string): Observable<HotkeyEvent> => {
  return useMemo(() => hotkeyManager.on(combo), [combo]);
};
