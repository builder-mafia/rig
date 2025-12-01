import { atom } from 'jotai';

const isOpenAtom = atom(false);

export const leftPanelAtoms = {
  isOpen: isOpenAtom,
};
