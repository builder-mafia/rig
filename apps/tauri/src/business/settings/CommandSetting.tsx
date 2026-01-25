'use client';

import { HomeCommandView } from '../command-k/views/HomeCommandView';
import { ModelSelectView } from '../command-k/views/ModelSelectView';
import { ProviderConfigCommandView } from '../command-k/views/ProviderConfigCommandView';
import { ProvidersCommandView } from '../command-k/views/ProvidersCommandView';

export function CommandSetting() {
  return (
    <>
      <p className="text-muted-foreground text-sm">
        Press{' '}
        <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
          <span className="text-xs">⌘</span>J
        </kbd>
      </p>
      <HomeCommandView />
      <ProvidersCommandView />
      <ProviderConfigCommandView />
      <ModelSelectView />
    </>
  );
}
