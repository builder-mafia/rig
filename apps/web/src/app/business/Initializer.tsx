'use client';

import { useStore } from 'jotai';
import { useEffect } from 'react';
import { useSwrAtomValue } from '@/hooks/use-swr-atom-value';
import { observeAddMessage } from '@/idb/db-store-side-effect';
import { selectedChannelSideEffectAtom } from '@/idb/side-effects/selected-channel-side-effect';

export const Initializer = () => {
  const store = useStore();
  useSwrAtomValue(selectedChannelSideEffectAtom);

  useEffect(() => {
    const unsubAddMessage = observeAddMessage(store);

    return () => {
      unsubAddMessage();
    };
  }, [store]);

  return <></>;
};
