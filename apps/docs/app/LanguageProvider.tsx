'use client';

import { useRouter } from 'next/navigation';
import { Select } from 'nextra/components';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useTransition,
} from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { getTranslator, type Locale, localeCookie } from './i18n';

const LanguageContext = createContext<{
  locale: Locale;
  pending: boolean;
  setLocale: (locale: Locale) => void;
} | null>(null);

export function LanguageProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(next: Locale) {
    if (next === locale) return;
    // biome-ignore lint/suspicious/noDocumentCookie: The server needs this preference, including in browsers without Cookie Store support.
    document.cookie = `${localeCookie}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    startTransition(() => router.refresh());
  }

  return (
    <LanguageContext value={{ locale, pending, setLocale }}>
      {children}
    </LanguageContext>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage requires LanguageProvider');
  return { ...context, t: getTranslator(context.locale) };
}

export function LanguageToggle() {
  const { locale, pending, setLocale } = useLanguage();
  return (
    <fieldset
      aria-label={locale === 'ko' ? '언어 선택' : 'Language'}
      disabled={pending}
      aria-busy={pending}
      className='inline-flex shrink-0'
    >
      <Select
        value={locale}
        title={locale === 'ko' ? '언어 선택' : 'Language'}
        selectedOption={
          <span className='inline-flex items-center gap-1.5'>
            <span lang={locale}>{locale === 'ko' ? '한국어' : 'English'}</span>
            <FiChevronDown aria-hidden='true' size={12} />
          </span>
        }
        options={[
          { id: 'ko', name: <span lang='ko'>한국어</span> },
          { id: 'en', name: <span lang='en'>English</span> },
        ]}
        onChange={language => {
          if (language === 'ko' || language === 'en') setLocale(language);
        }}
        anchor={{ to: 'bottom end', gap: 8 }}
        className='min-h-9 rounded-lg border border-black/10 dark:border-white/15'
      />
    </fieldset>
  );
}
