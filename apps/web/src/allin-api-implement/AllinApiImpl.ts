import type { AllinAPI } from '@allin/api';
import { AIImpl } from './implement/AiImpl';
import { ModalImpl } from './implement/ModalImpl';
import { SidebarImpl } from './implement/SidebarImpl';
import { TextSelectionFloatingButtonListImpl } from './implement/TextSelectionFloatingButtonListImpl';

export const AllinApiImpl: AllinAPI = {
  AI: AIImpl,
  Modal: ModalImpl,
  Sidebar: SidebarImpl,
  TextSelectionFloatingButtonList: TextSelectionFloatingButtonListImpl,
};
