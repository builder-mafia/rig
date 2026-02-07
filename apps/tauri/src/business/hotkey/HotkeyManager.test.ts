import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HotkeyEvent } from './types';

let HotkeyManager: typeof import('./HotkeyManager').HotkeyManager;

const MOD = { ctrlKey: true } as const;

function createKeyboardEvent(
  key: string,
  modifiers: {
    metaKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
  } = {},
  target?: HTMLElement,
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    ...modifiers,
  });
  if (target) {
    Object.defineProperty(event, 'target', { value: target });
  }
  return event;
}

describe('HotkeyManager', () => {
  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('./HotkeyManager');
    HotkeyManager = mod.HotkeyManager;
  });

  describe('on(combo) emits HotkeyEvent', () => {
    it('emits when matching combo is pressed', async () => {
      const manager = HotkeyManager.getInstance();
      const received: HotkeyEvent[] = [];
      const sub = manager.on('mod+j').subscribe(e => received.push(e));

      document.dispatchEvent(createKeyboardEvent('j', MOD));

      expect(received).toHaveLength(1);
      expect(received[0].originalEvent.key).toBe('j');
      sub.unsubscribe();
    });

    it('does NOT emit for non-matching combos', () => {
      const manager = HotkeyManager.getInstance();
      const received: HotkeyEvent[] = [];
      const sub = manager.on('mod+j').subscribe(e => received.push(e));

      document.dispatchEvent(createKeyboardEvent('k', MOD));

      expect(received).toHaveLength(0);
      sub.unsubscribe();
    });
  });

  describe('isInputContext', () => {
    it('is true when target is <input>', () => {
      const manager = HotkeyManager.getInstance();
      const input = document.createElement('input');
      const received: HotkeyEvent[] = [];
      const sub = manager.on('mod+j').subscribe(e => received.push(e));

      document.dispatchEvent(createKeyboardEvent('j', MOD, input));

      expect(received[0].isInputContext).toBe(true);
      sub.unsubscribe();
    });

    it('is true when target is <textarea>', () => {
      const manager = HotkeyManager.getInstance();
      const textarea = document.createElement('textarea');
      const received: HotkeyEvent[] = [];
      const sub = manager.on('mod+j').subscribe(e => received.push(e));

      document.dispatchEvent(createKeyboardEvent('j', MOD, textarea));

      expect(received[0].isInputContext).toBe(true);
      sub.unsubscribe();
    });

    it('is true when target is contentEditable', () => {
      const manager = HotkeyManager.getInstance();
      const div = document.createElement('div');
      div.contentEditable = 'true';
      const received: HotkeyEvent[] = [];
      const sub = manager.on('mod+j').subscribe(e => received.push(e));

      document.dispatchEvent(createKeyboardEvent('j', MOD, div));

      expect(received[0].isInputContext).toBe(true);
      sub.unsubscribe();
    });

    it('is false when target is <div>', () => {
      const manager = HotkeyManager.getInstance();
      const div = document.createElement('div');
      const received: HotkeyEvent[] = [];
      const sub = manager.on('mod+j').subscribe(e => received.push(e));

      document.dispatchEvent(createKeyboardEvent('j', MOD, div));

      expect(received[0].isInputContext).toBe(false);
      sub.unsubscribe();
    });
  });

  describe('multiple subscribers', () => {
    it('all receive the event for the same combo', () => {
      const manager = HotkeyManager.getInstance();
      const received1: HotkeyEvent[] = [];
      const received2: HotkeyEvent[] = [];
      const sub1 = manager.on('mod+j').subscribe(e => received1.push(e));
      const sub2 = manager.on('mod+j').subscribe(e => received2.push(e));

      document.dispatchEvent(createKeyboardEvent('j', MOD));

      expect(received1).toHaveLength(1);
      expect(received2).toHaveLength(1);
      sub1.unsubscribe();
      sub2.unsubscribe();
    });
  });

  describe('unsubscribe', () => {
    it('unsubscribed listener does not receive events', () => {
      const manager = HotkeyManager.getInstance();
      const received: HotkeyEvent[] = [];
      const sub = manager.on('mod+j').subscribe(e => received.push(e));

      sub.unsubscribe();

      document.dispatchEvent(createKeyboardEvent('j', MOD));

      expect(received).toHaveLength(0);
    });
  });

  describe('normalizeCombo', () => {
    it('produces mod+j for Ctrl+J on non-mac', () => {
      const manager = HotkeyManager.getInstance();
      const received: HotkeyEvent[] = [];
      const sub = manager.on('mod+j').subscribe(e => received.push(e));

      document.dispatchEvent(createKeyboardEvent('j', MOD));

      expect(received).toHaveLength(1);
      sub.unsubscribe();
    });

    it('produces mod+shift+p for Ctrl+Shift+P', () => {
      const manager = HotkeyManager.getInstance();
      const received: HotkeyEvent[] = [];
      const sub = manager.on('mod+shift+p').subscribe(e => received.push(e));

      document.dispatchEvent(
        createKeyboardEvent('p', { ctrlKey: true, shiftKey: true }),
      );

      expect(received).toHaveLength(1);
      sub.unsubscribe();
    });

    it('produces escape for Escape key alone', () => {
      const manager = HotkeyManager.getInstance();
      const received: HotkeyEvent[] = [];
      const sub = manager.on('escape').subscribe(e => received.push(e));

      document.dispatchEvent(createKeyboardEvent('Escape'));

      expect(received).toHaveLength(1);
      sub.unsubscribe();
    });

    it('uses metaKey as mod on mac platform', async () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });
      vi.resetModules();
      const { HotkeyManager: MacManager } = await import('./HotkeyManager');
      const manager = MacManager.getInstance();
      const received: HotkeyEvent[] = [];
      const sub = manager.on('mod+j').subscribe(e => received.push(e));

      document.dispatchEvent(createKeyboardEvent('j', { metaKey: true }));

      expect(received).toHaveLength(1);
      sub.unsubscribe();

      Object.defineProperty(navigator, 'platform', {
        value: '',
        configurable: true,
      });
    });
  });
});
