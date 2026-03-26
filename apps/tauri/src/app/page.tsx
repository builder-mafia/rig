'use client';

import { Toaster } from '@allin/ui';
import { ConfigFileWorkbenchView } from '@/business/config-file/ConfigFileWorkbenchView';
import { ServiceProvider } from '@/business/ServiceContext';
import { QueryProvider } from '@/lib/QueryProvider';

const Home = () => {
  return (
    <ServiceProvider>
      <QueryProvider>
        <Toaster richColors duration={3000} theme='light' />
        <ConfigFileWorkbenchView />
      </QueryProvider>
    </ServiceProvider>
  );
};

export default Home;
