import type { AI } from './ai';
import type { AUI } from './aui';
import type { Event } from './event';
import type { Modal } from './modal';
import type { Sidebar } from './sidebar';
import type { TextSelectionFloatingButtonList } from './text-selection';

export * from './ai';
export * from './aui';
export * from './event';
export * from './modal';
export * from './sidebar';
export * from './text-selection';

export interface ExtensionContext {
  ai: AI;
  modal: Modal;
  sidebar: Sidebar;
  TextSelectionFloatingButtonList: TextSelectionFloatingButtonList;
  aui: AUI;
  event: Event;
}
