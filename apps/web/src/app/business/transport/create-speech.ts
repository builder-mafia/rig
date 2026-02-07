'use client';

import { createOpenAI } from '@ai-sdk/openai';
import type { ProviderId } from '@allin/ai';
import { experimental_generateSpeech as generateSpeech } from 'ai';

export type SpeakOptions = {
  text: string;
  modelId: string;
  voice?: string;
  outputFormat?: 'mp3' | 'wav' | (string & {});
  instructions?: string;
  speed?: number;
  language?: string;
  abortSignal?: AbortSignal;
};

export type SpeakResult = {
  audioElement: HTMLAudioElement;
  stop: () => void;
};

export async function createSpeech(
  providerName: ProviderId,
  apiKey: string,
  options: SpeakOptions,
): Promise<SpeakResult> {
  const {
    text,
    modelId,
    voice,
    outputFormat,
    instructions,
    speed,
    language,
    abortSignal,
  } = options;

  if (providerName !== 'openai') {
    throw new Error(`Provider ${providerName} does not support TTS.`);
  }

  const client = createOpenAI({ apiKey });
  const speechModel = client.speech(modelId);

  const { audio } = await generateSpeech({
    model: speechModel,
    text,
    voice,
    outputFormat,
    instructions,
    speed,
    language,
    abortSignal,
  });

  // Some environments type Uint8Array.buffer as ArrayBufferLike (incl. SharedArrayBuffer).
  // BlobPart is stricter (ArrayBuffer). Create an ArrayBuffer-backed copy.
  const bytes = Uint8Array.from(audio.uint8Array);
  const blob = new Blob([bytes], { type: audio.mediaType });
  const url = URL.createObjectURL(blob);

  const audioElement = new Audio(url);

  const cleanup = () => {
    URL.revokeObjectURL(url);
  };

  audioElement.addEventListener('ended', cleanup, { once: true });
  audioElement.addEventListener('error', cleanup, { once: true });

  await audioElement.play();

  return {
    audioElement,
    stop: () => {
      audioElement.pause();
      audioElement.currentTime = 0;
      cleanup();
    },
  };
}
