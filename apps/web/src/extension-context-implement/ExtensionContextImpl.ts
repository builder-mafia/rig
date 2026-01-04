import type { ExtensionContext } from '@allin/context';
import { AIImpl } from './implement/AiImpl';
import { ModalImpl } from './implement/ModalImpl';
import { SidebarImpl } from './implement/SidebarImpl';
import { TextSelectionFloatingButtonListImpl } from './implement/TextSelectionFloatingButtonListImpl';

export const extensionContextImpl: ExtensionContext = {
  AI: AIImpl,
  Modal: ModalImpl,
  Sidebar: SidebarImpl,
  TextSelectionFloatingButtonList: TextSelectionFloatingButtonListImpl,
};
