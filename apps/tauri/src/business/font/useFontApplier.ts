import { useEffect } from 'react';
import { useAppSettings } from '@/lib/gateway/app-setting/useAppSettings';

export const useFontApplier = () => {
  const { settings } = useAppSettings();

  useEffect(() => {
    const root = document.documentElement;

    if (settings?.fontFamily) {
      root.style.setProperty('--font-app', settings.fontFamily);
    } else {
      root.style.removeProperty('--font-app');
    }
  }, [settings?.fontFamily]);
};
