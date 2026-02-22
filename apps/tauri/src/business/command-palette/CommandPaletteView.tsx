'use client';

import type { ProviderId } from '@allin/ai';
import { useEffect } from 'react';
import { filter } from 'rxjs';
import { match } from 'ts-pattern';
import { useHotKey } from '@/business/hotkey/useHotKey';
import { AgentCreateView } from './panes/AgentCreateView';
import { AgentEditView, AgentEditViewPropsSchema } from './panes/AgentEditView';
import { AgentListView } from './panes/AgentListView';
import { ChannelListView } from './panes/ChannelListView';
import { HomeCommandView } from './panes/HomeCommandView';
import { ModelSelectView } from './panes/ModelSelectView';
import { ProviderConfigCommandView } from './panes/ProviderConfigCommandView';
import { ProvidersCommandView } from './panes/ProvidersCommandView';
import { useCommandPalette } from './useCommandPalette';

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

  return (
    <>
      {match(currentPane.paneId)
        .with('home', () => <HomeCommandView {...currentPane.paneProps} />)
        .with('channels', () => <ChannelListView {...currentPane.paneProps} />)
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
        .with('agent-list', () => <AgentListView {...currentPane.paneProps} />)
        .with('agent-create', () => <AgentCreateView />)
        .with('agent-edit', () => {
          const props = AgentEditViewPropsSchema.parse(currentPane.paneProps);
          return <AgentEditView {...props} />;
        })
        .with(null, () => null)
        .exhaustive()}
    </>
  );
};
