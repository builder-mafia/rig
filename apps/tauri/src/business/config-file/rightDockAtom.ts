import { atom } from 'jotai';

export type RightDockPane = 'chat' | 'history';

export const isRightDockOpenAtom = atom(false);
export const rightDockPaneAtom = atom<RightDockPane>('chat');
