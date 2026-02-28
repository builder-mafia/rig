import { Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import type { ReactNode } from 'react';
import { FaLinkedinIn, FaXTwitter } from 'react-icons/fa6';
import './globals.css';
import 'nextra-theme-docs/style.css';

export const metadata = {
  title: {
    default: 'ALLIN Docs',
    template: '%s | ALLIN Docs',
  },
  description:
    'Official documentation for ALLIN - An open-source AI all-in-one kit',
};

const navbar = (
  <Navbar
    logo={<b>ALLIN</b>}
    projectLink='https://github.com/your-username/allin'
  />
);

const footer = (
  <Footer>
    <div className='flex w-full items-center gap-2 text-sm'>
      <div className='flex flex-row items-center gap-3'>
        <span>최신 소식을 팔로우 하세요.</span>
        <a
          href='https://linkedin.com/in/your-profile'
          target='_blank'
          rel='noopener noreferrer'
          aria-label='LinkedIn'
          className='text-current opacity-60 transition-opacity hover:opacity-100'
        >
          <FaLinkedinIn size={20} />
        </a>
        <a
          href='https://x.com/your-handle'
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

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pageMap = await getPageMap();

  return (
    <html lang='en' dir='ltr' suppressHydrationWarning>
      <Head>
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <body>
        <Layout
          navbar={navbar}
          pageMap={pageMap}
          docsRepositoryBase='https://github.com/your-username/allin/tree/main/apps/docs'
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
