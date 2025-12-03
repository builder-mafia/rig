'use client';

import { useStore } from 'jotai';
import { useEffect } from 'react';
import { observeAddMessage } from '@/idb/db-store-side-effect';

export const Initializer = () => {
  const store = useStore();

  useEffect(() => {
    const unsub = observeAddMessage(store);
    return () => {
      unsub();
    };
  }, [store]);

  return <></>;
};
