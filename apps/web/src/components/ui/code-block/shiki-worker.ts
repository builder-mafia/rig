import { getHighlighter } from './getHighlighter';

export type ShikiWorkerRequest = {
  id: number;
  code: string;
  language: string;
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

  getHighlighter(language)
    .then(highlighter => {
      const html = highlighter.codeToHtml(code, {
        lang: language,
        theme: 'github-dark',
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
};
