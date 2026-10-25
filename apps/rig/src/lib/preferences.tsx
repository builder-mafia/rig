'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { toast } from '@allin/ui';
import { translate, type Locale } from './translations';

export const PREFERENCES_KEY = 'rig:preferences:v1';
export type Theme = 'system' | 'light' | 'dark';
export type Language = 'system' | Locale;
export interface Preferences {
  language: Language;
  theme: Theme;
}
export const parsePreferences = (value: string | null): Preferences => {
  try {
    const parsed = JSON.parse(value ?? '{}');
    return {
      language: ['en', 'ko'].includes(parsed?.language)
        ? parsed.language
        : 'system',
      theme: ['light', 'dark'].includes(parsed?.theme)
        ? parsed.theme
        : 'system',
    };
  } catch {
    return { language: 'system', theme: 'system' };
  }
};
const readPreferences = () => {
  try {
    return parsePreferences(localStorage.getItem(PREFERENCES_KEY));
  } catch {
    return parsePreferences(null);
  }
};
const getSnapshot = () => {
  const { language, theme } = readPreferences();
  const locale =
    language === 'system'
      ? navigator.language.toLowerCase().startsWith('ko')
        ? 'ko'
        : 'en'
      : language;
  const resolvedTheme =
    theme === 'system'
      ? window.matchMedia?.('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;
  return `${language}|${theme}|${locale}|${resolvedTheme}`;
};
const getServerSnapshot = () => 'system|system|en|light';
const subscribe = (notify: () => void) => {
  const media = window.matchMedia?.('(prefers-color-scheme: dark)');
  window.addEventListener('rig-preferences', notify);
  window.addEventListener('storage', notify);
  window.addEventListener('languagechange', notify);
  media?.addEventListener('change', notify);
  return () => {
    window.removeEventListener('rig-preferences', notify);
    window.removeEventListener('storage', notify);
    window.removeEventListener('languagechange', notify);
    media?.removeEventListener('change', notify);
  };
};
const defaults = {
  language: 'system' as Language,
  theme: 'system' as Theme,
  locale: 'en' as Locale,
  resolvedTheme: 'light' as 'light' | 'dark',
  t: translate('en'),
  setPreferences: (() => false) as (changes: Partial<Preferences>) => boolean,
};
const PreferencesContext = createContext(defaults);
export const usePreferences = () => useContext(PreferencesContext);
export const useI18n = usePreferences;

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const value = useMemo(() => {
    const [language, theme, locale, resolvedTheme] = snapshot.split('|') as [
      Language,
      Theme,
      Locale,
      'light' | 'dark',
    ];
    const t = translate(locale);
    return {
      language,
      theme,
      locale,
      resolvedTheme,
      t,
      setPreferences: (changes: Partial<Preferences>) => {
        try {
          localStorage.setItem(
            PREFERENCES_KEY,
            JSON.stringify({ ...readPreferences(), ...changes }),
          );
          window.dispatchEvent(new Event('rig-preferences'));
          return true;
        } catch {
          toast.error(t('Couldn’t save preferences. Try again.'));
          return false;
        }
      },
    };
  }, [snapshot]);
  useEffect(() => {
    document.documentElement.lang = value.locale;
    document.documentElement.classList.toggle(
      'dark',
      value.resolvedTheme === 'dark',
    );
    document.documentElement.style.colorScheme = value.resolvedTheme;
  }, [value.locale, value.resolvedTheme]);
  useEffect(() => {
    if (!('__TAURI_INTERNALS__' in window)) return;
    let active = true;
    void import('@tauri-apps/api/window')
      .then(({ getCurrentWindow }) => {
        if (active)
          return getCurrentWindow().setTheme(
            value.theme === 'system' ? null : value.theme,
          );
      })
      .catch(() => {
        /* Web content still follows the selected theme. */
      });
    return () => {
      active = false;
    };
  }, [value.theme]);
  useEffect(() => {
    if (!('__TAURI_INTERNALS__' in window)) return;
    let active = true;
    void import('@tauri-apps/api/core')
      .then(({ invoke }) => {
        if (active) return invoke('set_app_language', { locale: value.locale });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [value.locale]);
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};
