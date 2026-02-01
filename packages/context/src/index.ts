import type { AI } from './ai';
import type { Event } from './event';
import type { Modal } from './modal';
import type { Sidebar } from './sidebar';
import type { SlashCommand } from './slash-command/slash-command-interface';
import type { TextSelectionFloatingButtonList } from './text-selection';
import type { UI } from './ui';

export * from './ai';
export * from './event';
export * from './modal';
export * from './sidebar';
export * from './text-selection';
export * from './ui';

export interface ExtensionContext {
  ai: AI;
  modal: Modal;
  sidebar: Sidebar;
  TextSelectionFloatingButtonList: TextSelectionFloatingButtonList;
  ui: UI;
  event: Event;
  slashCommand: SlashCommand;
}
