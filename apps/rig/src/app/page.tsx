'use client';

import { Toaster } from '@allin/ui';
import { QueryProvider } from '@/lib/QueryProvider';

const Home = () => {
  return (
    <QueryProvider>
      <Toaster richColors duration={3000} theme='light' />
    </QueryProvider>
  );
};

export default Home;
