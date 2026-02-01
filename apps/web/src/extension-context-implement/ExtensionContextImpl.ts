import type { ExtensionContext } from '@allin/context';
import { AIImpl } from './implement/AiImpl';
import { EventImpl } from './implement/event-implement';
import { ModalImpl } from './implement/ModalImpl';
import { SidebarImpl } from './implement/SidebarImpl';
import { TextSelectionFloatingButtonListImpl } from './implement/TextSelectionFloatingButtonListImpl';
import { UIImpl } from './implement/ui-implement';

export const extensionContextImpl: ExtensionContext = {
  ai: AIImpl,
  modal: ModalImpl,
  sidebar: SidebarImpl,
  TextSelectionFloatingButtonList: TextSelectionFloatingButtonListImpl,
  ui: UIImpl,
  event: EventImpl,
  slashCommand: {
    add: () => {},
    remove: () => {},
    list: () => [],
  },
};
