'use client';

import { useStore } from 'jotai';
import { useEffect } from 'react';
import { loadExtensions } from '@/extension/loader';
import { extensionContextImpl } from '@/extension-context-implement/ExtensionContextImpl';
import { observeAddMessage } from '@/idb/db-store-side-effect';

export const Initializer = () => {
  const store = useStore();

  useEffect(() => {
    const unsubAddMessage = observeAddMessage(store);

    return () => {
      unsubAddMessage();
    };
  }, [store]);

  useEffect(() => {
    loadExtensions(extensionContextImpl);
  }, []);

  return null;
};
