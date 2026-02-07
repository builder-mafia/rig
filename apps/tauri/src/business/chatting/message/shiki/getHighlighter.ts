import type { Highlighter } from 'shiki';
import { createOnigurumaEngine } from 'shiki';
import { getSingletonHighlighter } from 'shiki/bundle/full';

export const getHighlighter = async (
  language: string,
): Promise<Highlighter> => {
  try {
    return await getSingletonHighlighter({
      langs: [language],
      themes: ['github-light', 'github-dark'],
      engine: createOnigurumaEngine(import('shiki/wasm')),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Language')) {
      return await getSingletonHighlighter({
        langs: ['plaintext'],
        themes: ['github-light', 'github-dark'],
        engine: createOnigurumaEngine(import('shiki/wasm')),
      });
    }
    throw error;
  }
};
