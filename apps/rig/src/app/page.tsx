'use client';

import { Toaster } from '@allin/ui';
import { AppUpdateDialog } from '@/features/update/components/AppUpdateDialog';
import { QueryProvider } from '@/lib/QueryProvider';
import { Root } from './root';

const Home = () => {
  return (
    <QueryProvider>
      <Root />
      <AppUpdateDialog />
      <Toaster richColors duration={3000} theme='light' />
    </QueryProvider>
  );
};

export default Home;
