'use client';

import type { ProviderId } from '@allin/ai';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { filter } from 'rxjs';
import { match } from 'ts-pattern';
import { useHotKey } from '@/business/hotkey/useHotKey';
import { AgentCreateView } from './panes/AgentCreateView';
import { AgentEditView, AgentEditViewPropsSchema } from './panes/AgentEditView';
import { AgentListView } from './panes/AgentListView';
import { AppUpdateView } from './panes/AppUpdateView';
import { ChannelListView } from './panes/ChannelListView';
import { FontFamilyView } from './panes/FontFamilyView';
import { HomeCommandView } from './panes/HomeCommandView';
import { ProviderAuthPane } from './panes/ProviderAuthPane';
import { ProvidersCommandView } from './panes/ProvidersCommandView';
import { SwitchModelView } from './panes/SwitchModelView';
import { useCommandPalette } from './useCommandPalette';

const OPEN_APP_UPDATE_EVENT = 'open-app-update';

export const CommandPalette = () => {
  const { currentPane, navigate } = useCommandPalette();
  const modK$ = useHotKey('mod+k');

  useEffect(() => {
    const sub = modK$
      .pipe(filter(() => currentPane.paneId === null))
      .subscribe(e => {
        // prevent key press in input, textarea, etc..
        e.originalEvent.preventDefault();
        navigate('home');
      });
    return () => sub.unsubscribe();
  }, [modK$, currentPane.paneId, navigate]);

  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | null = null;

    const setupListener = async () => {
      unlisten = await listen(OPEN_APP_UPDATE_EVENT, () => {
        navigate('app-update');
      });

      if (disposed) {
        unlisten();
      }
    };

    setupListener();

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [navigate]);

  return (
    <>
      {match(currentPane.paneId)
        .with('home', () => <HomeCommandView />)
        .with('channels', () => <ChannelListView />)
        .with('providers', () => <ProvidersCommandView />)
        .with('provider-config', () => (
          <ProviderAuthPane
            providerId={
              (currentPane.paneProps as { providerId: ProviderId }).providerId
            }
          />
        ))
        .with('model-select', () => <SwitchModelView />)
        .with('agent-list', () => <AgentListView />)
        .with('agent-create', () => <AgentCreateView />)
        .with('agent-edit', () => {
          const props = AgentEditViewPropsSchema.parse(currentPane.paneProps);
          return <AgentEditView {...props} />;
        })
        .with('app-update', () => <AppUpdateView />)
        .with('font-family', () => <FontFamilyView />)
        .with(null, () => null)
        .exhaustive()}
    </>
  );
};
