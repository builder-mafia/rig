import type { ExtensionContext } from '@allin/context';
import { AIImpl } from './implement/AiImpl';
import { AUIImpl } from './implement/aui-implement';
import { EventImpl } from './implement/event-implement';
import { ModalImpl } from './implement/ModalImpl';
import { SidebarImpl } from './implement/SidebarImpl';
import { TextSelectionFloatingButtonListImpl } from './implement/TextSelectionFloatingButtonListImpl';

export const extensionContextImpl: ExtensionContext = {
  ai: AIImpl,
  modal: ModalImpl,
  sidebar: SidebarImpl,
  TextSelectionFloatingButtonList: TextSelectionFloatingButtonListImpl,
  aui: AUIImpl,
  event: EventImpl,
};
