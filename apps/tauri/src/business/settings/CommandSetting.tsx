'use client';

import { HomeCommandView } from '../command-k/views/HomeCommandView';
import { ModelSelectView } from '../command-k/views/ModelSelectView';
import { ProviderConfigCommandView } from '../command-k/views/ProviderConfigCommandView';
import { ProvidersCommandView } from '../command-k/views/ProvidersCommandView';

export function CommandSetting() {
  return (
    <>
      <HomeCommandView />
      <ProvidersCommandView />
      <ProviderConfigCommandView />
      <ModelSelectView />
    </>
  );
}
