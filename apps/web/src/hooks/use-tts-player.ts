'use client';

import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { LLMProviderName } from '@/core/provider/all-models';
import { providerRegistry } from '@/core/provider/providerRegistry';
import { speak as speakAudio } from '@/core/speech/speak';
import { useSwrAtomValue } from '@/hooks/use-swr-atom-value';
import { dbAtoms } from '@/idb/db-store';
import { assert } from '@/utils/assert';

type SpeakOptions = {
  /**
   * If not provided, uses the currently selected channel provider.
   */
  providerName?: LLMProviderName;
  modelId?: string;
  voice?: string;
  outputFormat?: 'mp3' | 'wav' | (string & {});
  instructions?: string;
  speed?: number;
  language?: string;
};

export function useTtsPlayer() {
  const selectedChannel = useSwrAtomValue(dbAtoms.selectedChannelAtom);
  useSwrAtomValue(dbAtoms.configAtom); // ensures config is loaded (providers are registered elsewhere)

  assert(selectedChannel, 'useTtsPlayer: selectedChannel is not found.');

  const stopRef = useRef<null | (() => void)>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    stopRef.current?.();
    stopRef.current = null;
  }, []);

  const speak = useCallback(
    async (text: string, options?: SpeakOptions) => {
      const providerName =
        options?.providerName ?? selectedChannel.providerName;

      if (!text.trim()) return;

      stop();

      if (!providerRegistry.has(providerName)) {
        return;
      }

      const defaultModelId =
        providerName === 'openai'
          ? 'tts-1'
          : providerName === 'google'
            ? 'google-tts'
            : 'tts';

      const provider = providerRegistry.get(providerName);
      if (!provider.getSpeechModel(defaultModelId)) {
        toast.error(`Provider ${providerName} does not support speech.`);
        return;
      }

      const abortController = new AbortController();
      abortRef.current = abortController;

      const defaultVoice =
        providerName === 'openai'
          ? 'alloy'
          : providerName === 'google'
            ? 'ko-KR-Standard-A'
            : undefined;

      const result = await speakAudio({
        provider,
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
    },
    [selectedChannel?.providerName, stop],
  );

  return { speak, stop };
}
