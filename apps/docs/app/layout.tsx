import Image from 'next/image';
import { Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import type { ReactNode } from 'react';
import { FaXTwitter } from 'react-icons/fa6';
import { ThemeToggle } from './ThemeToggle';
import './globals.css';
import 'nextra-theme-docs/style.css';

export const metadata = {
  title: {
    default: 'Rig Docs',
    template: '%s | Rig Docs',
  },
  description:
    'Official documentation for Rig, a local-first desktop app for organizing agent SKILL files and tracking usage.',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

const navbarLogo = (
  <span className='flex items-center gap-2'>
    <Image
      src='/icon.png'
      alt=''
      width={32}
      height={32}
      className='size-7 object-contain'
      priority
    />
    <b>Rig</b>
  </span>
);

const navbar = (
  <Navbar logo={navbarLogo} projectLink='https://github.com/builder-mafia/rig'>
    <ThemeToggle />
  </Navbar>
);

const footer = (
  <Footer>
    <div className='flex w-full flex-row justify-center items-center gap-3 text-sm'>
      <span>Follow the latest updates.</span>
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
  </Footer>
);

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pageMap = await getPageMap();

  return (
    <html lang='en' dir='ltr' suppressHydrationWarning>
      <Head>
        <link rel='icon' href='/icon.png' type='image/png' />
      </Head>
      <body>
        <Layout
          navbar={navbar}
          pageMap={pageMap}
          docsRepositoryBase='https://github.com/builder-mafia/rig/tree/main/apps/docs'
          footer={footer}
          darkMode={false}
          nextThemes={{ defaultTheme: 'light' }}
          search={false}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
