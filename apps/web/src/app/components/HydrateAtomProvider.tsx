'use client';

import { getDefaultStore, Provider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import type { ReactNode } from 'react';
import { leftPanelAtoms } from './left-panel/left-panel-store';

interface HydrateAtomProviderProps {
  children: ReactNode;
  leftPanelOpen?: boolean;
}

const HydrateAtoms = ({
  leftPanelOpen,
  children,
}: {
  leftPanelOpen?: boolean;
  children: ReactNode;
}) => {
  useHydrateAtoms([[leftPanelAtoms.isOpen, leftPanelOpen ?? false]]);
  return <>{children}</>;
};

const store = getDefaultStore();

export const HydrateAtomProvider = ({
  children,
  leftPanelOpen,
}: HydrateAtomProviderProps) => {
  return (
    <Provider store={store}>
      <HydrateAtoms leftPanelOpen={leftPanelOpen}>{children}</HydrateAtoms>
    </Provider>
  );
};
