'use client';

import { experimental_generateSpeech as generateSpeech } from 'ai';
import type { LLMProvider } from '../provider/LLMProvider';

export type SpeakOptions = {
  text: string;
  provider: LLMProvider;
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

export async function speak({
  provider,
  modelId,
  text,
  voice,
  outputFormat,
  instructions,
  speed,
  language,
  abortSignal,
}: SpeakOptions): Promise<SpeakResult> {
  const speechModel = provider.getSpeechModel(modelId);

  if (!speechModel) {
    throw new Error(`Provider ${provider.name} does not support TTS.`);
  }

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
