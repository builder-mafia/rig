'use client';

import type { LLMProviderName } from '@allin/chat';
import { AssertionError } from '@allin/utils';
import { assert } from 'es-toolkit';
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { createSpeech, type SpeakOptions } from '@/app/business/transport';
import { useSwrAtomValue } from '@/hooks/use-swr-atom-value';
import { dbAtoms } from '@/idb/db-store';

type UseTtsPlayerSpeakOptions = Omit<SpeakOptions, 'text'> & {
  providerName?: LLMProviderName;
};

export function useTtsPlayer() {
  const selectedChannel = useSwrAtomValue(dbAtoms.selectedChannelAtom);
  const config = useSwrAtomValue(dbAtoms.configAtom);

  assert(
    selectedChannel,
    new AssertionError('useTtsPlayer: selectedChannel is not found.'),
  );

  const stopRef = useRef<null | (() => void)>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    stopRef.current?.();
    stopRef.current = null;
  }, []);

  const speak = useCallback(
    async (text: string, options?: UseTtsPlayerSpeakOptions) => {
      const providerName =
        options?.providerName ?? selectedChannel.providerName;

      if (!text.trim()) return;

      stop();

      if (providerName !== 'openai') {
        toast.error(`Provider ${providerName} does not support speech.`);
        return;
      }

      const apiKey = config.apiKeys[providerName];
      if (!apiKey) {
        toast.error(`API key for ${providerName} is not configured.`);
        return;
      }

      const abortController = new AbortController();
      abortRef.current = abortController;

      const defaultModelId = 'tts-1';
      const defaultVoice = 'alloy';

      try {
        const result = await createSpeech(providerName, apiKey, {
          text,
          modelId: options?.modelId ?? defaultModelId,
          voice: options?.voice ?? defaultVoice,
          outputFormat: options?.outputFormat ?? 'mp3',
          instructions: options?.instructions,
          speed: options?.speed,
          language: options?.language,
          abortSignal: abortController.signal,
        });

        stopRef.current = result.stop;
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          toast.error(`Failed to play speech: ${error.message}`);
        }
      }
    },
    [selectedChannel?.providerName, config.apiKeys, stop],
  );

  return { speak, stop };
}
