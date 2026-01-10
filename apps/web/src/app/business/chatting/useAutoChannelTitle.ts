import {
  Agent,
  type LLMProviderName,
  Prompt,
  providerRegistry,
} from '@allin/chat';
import { useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import z from 'zod/v3';
import { dbAtoms } from '@/idb/db-store';
import type { ChatFacade } from './facade';

export const useAutoChannelTitle = (
  chatFacade: ChatFacade,
  hasTitle: boolean,
) => {
  const updateChannel = useSetAtom(dbAtoms.updateChannelAtom);
  const isGenerating = useRef(false);

  // create title if it is not set.
  useEffect(() => {
    if (hasTitle) {
      return;
    }

    const model = providerRegistry
      .get(chatFacade.getProviderName() as LLMProviderName)
      .getModel(chatFacade.getModelId());

    const subscription = chatFacade.finish$.subscribe(result => {
      if (
        result.isError ||
        result.isAbort ||
        result.isDisconnect ||
        isGenerating.current
      ) {
        return;
      }

      isGenerating.current = true;

      Agent.generate({
        messages: result.messages,
        description: Prompt.title,
        model,
        schema: z.object({
          title: z.string(),
        }),
      })
        .then(res => {
          // chatFacade's id is the same as the channel id.
          updateChannel(chatFacade.getId(), {
            title: res.title,
          });
        })
        .finally(() => {
          isGenerating.current = false;
        });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [chatFacade, hasTitle, updateChannel]);
};
