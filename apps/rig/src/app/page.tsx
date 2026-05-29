'use client';

import { Toaster } from '@allin/ui';
import { QueryProvider } from '@/lib/QueryProvider';
import { Root } from './root';

const Home = () => {
  return (
    <QueryProvider>
      <Root />
      <Toaster richColors duration={3000} theme='light' />
    </QueryProvider>
  );
};

export default Home;
