import type { TextSelectionFloatingButtonList } from '@allin/context';
import { getDefaultStore } from 'jotai';
import { textSelectionFloatingButtonListAtom } from '@/app/business/chatting/TextSelectionFloatingButtonList';

const store = getDefaultStore();

export const TextSelectionFloatingButtonListImpl: TextSelectionFloatingButtonList =
  {
    add: (id, item) => {
      console.log('==> loaded textSelectionFloatingButtonListAtom', id, item);
      store.set(textSelectionFloatingButtonListAtom, prev => {
        const newMap = new Map(prev);
        newMap.set(id, item);
        return newMap;
      });

      return () => {
        store.set(textSelectionFloatingButtonListAtom, prev => {
          const newMap = new Map(prev);
          newMap.delete(id);
          return newMap;
        });
      };
    },
    remove: id => {
      //
    },
    list: () => {
      return [];
    },
    has: id => {
      return false;
    },
  };
