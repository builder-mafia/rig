import { useEffect, useState } from 'react';
import { extensionLoader } from './ExtensionLoader';

export const useExtensionLoader = () => {
  const [loader, setLoader] = useState<typeof extensionLoader | null>(null);

  useEffect(() => {
    setLoader(extensionLoader);
  }, []);

  return loader;
};
