'use client';

import type { ProviderId } from '@allin/ai';
import { useEffect } from 'react';
import { filter } from 'rxjs';
import { match } from 'ts-pattern';
import { useHotKey } from '@/business/hotkey/useHotKey';
import { ChannelsCommandView } from './panes/ChannelsCommandView';
import { HomeCommandView } from './panes/HomeCommandView';
import { ModelSelectView } from './panes/ModelSelectView';
import { ProviderConfigCommandView } from './panes/ProviderConfigCommandView';
import { ProvidersCommandView } from './panes/ProvidersCommandView';
import { useCommandPalette } from './useCommandPalette';

export const CommandPalette = () => {
  const { currentPane, navigate } = useCommandPalette();
  const hotkey$ = useHotKey('mod+j');

  useEffect(() => {
    const sub = hotkey$
      .pipe(
        filter(() => currentPane.paneId === null),
      )
      .subscribe(e => {
        e.originalEvent.preventDefault();
        navigate('home');
      });
    return () => sub.unsubscribe();
  }, [hotkey$, currentPane.paneId, navigate]);

  return (
    <>
      {match(currentPane.paneId)
        .with('home', () => <HomeCommandView {...currentPane.paneProps} />)
        .with('channels', () => (
          <ChannelsCommandView {...currentPane.paneProps} />
        ))
        .with('providers', () => (
          <ProvidersCommandView {...currentPane.paneProps} />
        ))
        .with('provider-config', () => (
          <ProviderConfigCommandView
            providerId={currentPane.paneProps?.providerId as ProviderId}
          />
        ))
        .with('model-select', () => (
          <ModelSelectView {...currentPane.paneProps} />
        ))
        .with(null, () => null)
        .exhaustive()}
    </>
  );
};
