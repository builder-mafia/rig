import { Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import type { ReactNode } from 'react';
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

const footer = <Footer>MIT {new Date().getFullYear()} © ALLIN.</Footer>;

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
