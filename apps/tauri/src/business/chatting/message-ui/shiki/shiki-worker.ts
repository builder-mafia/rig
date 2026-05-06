import { getHighlighter } from './getHighlighter';
import {
  normalizeShikiLanguage,
  type SupportedShikiLanguage,
} from './shikiLanguageSchema';

export type ShikiWorkerRequest = {
  id: number;
  code: string;
  language: SupportedShikiLanguage;
};

export type ShikiWorkerResponse =
  | {
      id: number;
      html: string;
    }
  | {
      id: number;
      error: string;
    };

self.onmessage = (event: MessageEvent<ShikiWorkerRequest>) => {
  const { id, code, language } = event.data;
  const shikiLanguage = normalizeShikiLanguage(language);

  getHighlighter(shikiLanguage)
    .then(highlighter => {
      const html = highlighter.codeToHtml(code, {
        lang: shikiLanguage,
        themes: { light: 'github-light', dark: 'github-dark' },
      });

      const response: ShikiWorkerResponse = { id, html };
      self.postMessage(response);
    })
    .catch(() => {
      getHighlighter('plaintext')
        .then(highlighter => {
          const html = highlighter.codeToHtml(code, {
            lang: 'plaintext',
            themes: { light: 'github-light', dark: 'github-dark' },
          });

          const response: ShikiWorkerResponse = { id, html };
          self.postMessage(response);
        })
        .catch(error => {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';

          const response: ShikiWorkerResponse = {
            id,
            error: errorMessage,
          };
          self.postMessage(response);
        });
    });
};
