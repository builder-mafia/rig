import type { AI } from './ai';
import type { Modal } from './modal';
import type { Sidebar } from './sidebar';
import type { TextSelectionFloatingButtonList } from './text-selection';

export * from './ai';
export * from './modal';
export * from './sidebar';
export * from './text-selection';

export interface AllinAPI {
  AI: AI;
  Modal: Modal;
  Sidebar: Sidebar;
  TextSelectionFloatingButtonList: TextSelectionFloatingButtonList;
}
