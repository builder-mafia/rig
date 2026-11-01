import Image from 'next/image';
import type { PageMapItem } from 'nextra';
import { Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import type { ReactNode } from 'react';
import { FaXTwitter } from 'react-icons/fa6';
import appIcon from '../../rig/src-tauri/icons/icon.png';
import { DevTools } from './DevTools';
import { getTranslator, type Locale } from './i18n';
import { LanguageProvider, LanguageToggle } from './LanguageProvider';
import { getRequestLocale } from './locale-server';
import { ThemeToggle } from './ThemeToggle';
import './globals.css';
import 'nextra-theme-docs/style.css';

export const metadata = {
  title: {
    default: 'Rig Docs',
    template: '%s | Rig Docs',
  },
  description:
    'Official documentation for Rig, a local-first desktop app for organizing, copying, and sharing agent SKILL files.',
  icons: {
    icon: appIcon.src,
    shortcut: appIcon.src,
    apple: appIcon.src,
  },
};

const navbarLogo = (
  <span className='flex items-center gap-2 text-black dark:text-white'>
    <Image
      src={appIcon}
      alt=''
      width={32}
      height={32}
      className='size-7 object-contain'
      priority
    />
    <b>Rig</b>
  </span>
);

const createNavbar = (locale: Locale) => {
  const t = getTranslator(locale);
  return (
    <Navbar
      logo={navbarLogo}
      projectLink='https://github.com/builder-mafia/rig'
    >
      <a
        href='https://github.com/builder-mafia/rig/releases/latest'
        target='_blank'
        rel='noopener noreferrer'
        className='rig-pressable hidden min-h-9 items-center justify-center rounded-lg bg-neutral-900 px-3.5 text-xs font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5267f8] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 sm:inline-flex'
      >
        {t('Download')}
      </a>
      <LanguageToggle />
      <ThemeToggle />
    </Navbar>
  );
};

const createFooter = (locale: Locale) => {
  const t = getTranslator(locale);
  return (
    <Footer>
      <div className='flex w-full flex-col items-center justify-between gap-5 text-sm md:flex-row'>
        <span>
          {t('Rig is a local-first workspace for agent SKILL.md files.')}
        </span>
        <div className='flex items-center gap-5'>
          <a
            href='/docs'
            className='transition-colors hover:text-black dark:hover:text-white'
          >
            {t('Docs')}
          </a>
          <a
            href='https://github.com/builder-mafia/rig/releases'
            target='_blank'
            rel='noopener noreferrer'
            className='transition-colors hover:text-black dark:hover:text-white'
          >
            {t('Releases')}
          </a>
          <a
            href='https://github.com/builder-mafia/rig'
            target='_blank'
            rel='noopener noreferrer'
            className='transition-colors hover:text-black dark:hover:text-white'
          >
            GitHub
          </a>
          <a
            href='https://x.com/byeonggakyu'
            target='_blank'
            rel='noopener noreferrer'
            aria-label='X (Twitter)'
            className='text-current opacity-60 transition-opacity hover:opacity-100'
          >
            <FaXTwitter size={18} />
          </a>
        </div>
      </div>
    </Footer>
  );
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [pageMap, locale] = await Promise.all([
    getPageMap(),
    getRequestLocale(),
  ]);
  const t = getTranslator(locale);
  function localizePageMap(items: PageMapItem[]): PageMapItem[] {
    return items.map(item => {
      const localized = {
        ...item,
        ...('title' in item && typeof item.title === 'string'
          ? { title: t(item.title) }
          : {}),
      };
      if ('data' in localized) {
        return {
          ...localized,
          data: Object.fromEntries(
            Object.entries(localized.data).map(([key, value]) => [
              key,
              typeof value === 'string'
                ? t(value)
                : {
                    ...value,
                    ...(typeof value.title === 'string'
                      ? { title: t(value.title) }
                      : {}),
                  },
            ]),
          ),
        };
      }
      if ('children' in localized)
        return { ...localized, children: localizePageMap(localized.children) };
      return localized;
    });
  }

  return (
    <html lang={locale} dir='ltr' suppressHydrationWarning>
      <Head>
        <link rel='icon' href={appIcon.src} type='image/png' />
      </Head>
      <body>
        <LanguageProvider locale={locale}>
          <Layout
            navbar={createNavbar(locale)}
            pageMap={localizePageMap(pageMap)}
            docsRepositoryBase='https://github.com/builder-mafia/rig/tree/main/apps/docs'
            footer={createFooter(locale)}
            darkMode={false}
            nextThemes={{ defaultTheme: 'light' }}
            search={false}
            editLink={t('Edit this page')}
            feedback={{ content: t('Question? Give us feedback') }}
            toc={{ title: t('On This Page'), backToTop: t('Scroll to top') }}
          >
            {children}
          </Layout>
          <DevTools />
        </LanguageProvider>
      </body>
    </html>
  );
}
