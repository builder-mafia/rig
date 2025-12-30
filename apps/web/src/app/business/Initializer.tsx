'use client';

import { useStore } from 'jotai';
import { useEffect } from 'react';
import { useExtensionLoader } from '@/extension-adaptor/useExtensionLoader';
import { useSwrAtomValue } from '@/hooks/use-swr-atom-value';
import { observeAddMessage } from '@/idb/db-store-side-effect';
import { selectedChannelSideEffectAtom } from '@/idb/side-effects/selected-channel-side-effect';

export const Initializer = () => {
  const store = useStore();
  useSwrAtomValue(selectedChannelSideEffectAtom);
  const loader = useExtensionLoader();

  useEffect(() => {
    const unsubAddMessage = observeAddMessage(store);

    return () => {
      unsubAddMessage();
    };
  }, [store]);

  useEffect(() => {
    if (!loader) return;

    console.log('==> loading and activating extension');
    try {
      loader?.loadAndActivate('@allin/extension-quiz');
    } catch (error) {
      console.error('==> error loading and activating extension', error);
    }
  }, [loader]);

  return <></>;
};
