import { atom, useAtom } from 'jotai';

export type PaneType = 'content' | 'create-entry' | 'new-user';

const paneTypeAtom = atom<PaneType>('new-user');

export const usePaneType = () => {
  const [paneType, setPaneType] = useAtom(paneTypeAtom);

  return { paneType, setPaneType };
};
