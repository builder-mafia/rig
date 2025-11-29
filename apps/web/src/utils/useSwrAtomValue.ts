import { type Atom, useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { atomWithSwr } from './atomWithSwr';

export const useSwrAtomValue = <T>(atom: Atom<T>) => {
  const swrAtom = useMemo(() => atomWithSwr(atom), [atom]);
  const value = useAtomValue(swrAtom);

  return value;
};
