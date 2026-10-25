'use client';

import { Toaster } from '@allin/ui';
import { AppUpdateDialog } from '@/features/update/components/AppUpdateDialog';
import { QueryProvider } from '@/lib/QueryProvider';
import { PreferencesProvider, usePreferences } from '@/lib/preferences';
import { Root } from './root';

const Home = () => {
  return (
    <PreferencesProvider>
      <App />
    </PreferencesProvider>
  );
};

const App = () => {
  const { resolvedTheme, t } = usePreferences();
  return (
    <QueryProvider>
      <Root />
      <AppUpdateDialog />
      <Toaster
        containerAriaLabel={t('Notifications')}
        richColors
        duration={3000}
        theme={resolvedTheme}
      />
    </QueryProvider>
  );
};

export default Home;
