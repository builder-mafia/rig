import { cleanup, renderHook } from '@testing-library/react';
import { Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HotkeyEvent } from './types';
import { useHotKey } from './useHotKey';

vi.mock('./HotkeyManager', () => {
  const subject = new Subject<HotkeyEvent>();
  return {
    hotkeyManager: {
      on: vi.fn(() => subject.asObservable()),
    },
  };
});

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const { hotkeyManager } = await import('./HotkeyManager');
const mockOn = vi.mocked(hotkeyManager.on);

describe('useHotKey', () => {
  afterEach(() => {
    cleanup();
    mockOn.mockClear();
  });

  it('returns Observable', () => {
    const { result } = renderHook(() => useHotKey('mod+j'));

    expect(result.current).toBeDefined();
    expect(typeof result.current.subscribe).toBe('function');
  });

  it('returned Observable is stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useHotKey('mod+j'));

    const first = result.current;
    rerender();
    const second = result.current;

    expect(first).toBe(second);
  });

  it('calls hotkeyManager.on with the correct combo string', () => {
    renderHook(() => useHotKey('mod+shift+p'));

    expect(mockOn).toHaveBeenCalledWith('mod+shift+p');
  });

  it('returns different Observable for different combo', () => {
    const subjectJ = new Subject<HotkeyEvent>();
    const subjectK = new Subject<HotkeyEvent>();
    mockOn.mockImplementation((combo: string) => {
      if (combo === 'mod+j') return subjectJ.asObservable();
      return subjectK.asObservable();
    });

    const { result: resultJ } = renderHook(() => useHotKey('mod+j'));
    const { result: resultK } = renderHook(() => useHotKey('mod+k'));

    expect(resultJ.current).not.toBe(resultK.current);
  });
});
