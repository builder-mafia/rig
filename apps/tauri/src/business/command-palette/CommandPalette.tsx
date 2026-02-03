'use client';

import { useEffect, useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { CommandPaletteManager } from '../command-k/CommandPaletteManager';
import { ChannelsCommandView } from '../command-k/views/ChannelsCommandView';
import { HomeCommandView } from '../command-k/views/HomeCommandView';
import { ModelSelectView } from '../command-k/views/ModelSelectView';
import {
  ProviderConfigCommandView,
  type ProviderId,
} from '../command-k/views/ProviderConfigCommandView';
import { ProvidersCommandView } from '../command-k/views/ProvidersCommandView';
import type { CommandPaneState } from './types';

export const CommandPalette = () => {
  const [openedPane, setOpenedPane] = useState<CommandPaneState>({
    paneId: null,
    paneProps: {},
  });
  const commandPaletteManager = useMemo(
    () => CommandPaletteManager.getInstance(),
    [],
  );

  useEffect(() => {
    const subscription = commandPaletteManager
      .getViewState$()
      .subscribe(paneState => {
        console.log('paneState', paneState);
        setOpenedPane({
          paneId: paneState.paneId,
          paneProps: paneState.paneProps,
        });
      });

    return () => subscription.unsubscribe();
  }, [commandPaletteManager]);

  return (
    <>
      {match(openedPane.paneId)
        .with('home', () => <HomeCommandView {...openedPane.paneProps} />)
        .with('channels', () => (
          <ChannelsCommandView {...openedPane.paneProps} />
        ))
        .with('providers', () => (
          <ProvidersCommandView {...openedPane.paneProps} />
        ))
        .with('provider-config', () => (
          <ProviderConfigCommandView
            providerId={openedPane.paneProps?.providerId as ProviderId}
          />
        ))
        .with('model-select', () => (
          <ModelSelectView {...openedPane.paneProps} />
        ))
        .with(null, () => null)
        .exhaustive()}
    </>
  );
};
