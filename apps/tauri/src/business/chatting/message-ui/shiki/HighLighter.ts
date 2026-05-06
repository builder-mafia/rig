import { filter, Subject, take } from 'rxjs';
import { getHighlighter } from './getHighlighter';
import type { ShikiWorkerRequest, ShikiWorkerResponse } from './shiki-worker';
import {
  normalizeShikiLanguage,
  type SupportedShikiLanguage,
} from './shikiLanguageSchema';

// pre-builded worker file path
const WORKER_PATH = '/workers/shiki-worker.js';

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const createPlainCodeHtml = (code: string) => {
  return `<pre class="shiki github-light github-dark"><code>${escapeHtml(code)}</code></pre>`;
};

export class HighLighter {
  private useWorker: boolean;
  private worker: Worker | null = null;
  private requestIdCounter: number = 0;
  private workerResponse$ = new Subject<ShikiWorkerResponse>();

  constructor({ useWorker = true }: { useWorker: boolean }) {
    this.useWorker = useWorker;

    if (this.useWorker) {
      this.worker = new Worker(WORKER_PATH, {
        name: 'shiki-worker',
        type: 'module',
      });

      this.worker.onmessage = (event: MessageEvent<ShikiWorkerResponse>) => {
        this.workerResponse$.next(event.data);
      };
    }
  }

  private getWorker() {
    const worker = this.worker;
    if (!worker) {
      throw new Error('Worker not initialized');
    }
    return worker;
  }

  public highlight(
    code: string,
    language: SupportedShikiLanguage,
  ): Promise<string> {
    const shikiLanguage = normalizeShikiLanguage(language);

    if (this.useWorker) {
      const worker = this.getWorker();

      this.requestIdCounter += 1;
      const requestId = this.requestIdCounter;
      const payload: ShikiWorkerRequest = {
        id: requestId,
        code,
        language: shikiLanguage,
      };

      worker.postMessage(payload);

      return new Promise((resolve, reject) => {
        this.workerResponse$
          .asObservable()
          .pipe(
            filter(response => response.id === requestId),
            take(1),
          )
          .subscribe(response => {
            if ('error' in response) {
              resolve(createPlainCodeHtml(code));
              return;
            }
            resolve(response.html);
          });
      });
    } else {
      return getHighlighter(shikiLanguage)
        .then(highlighter => {
          return highlighter.codeToHtml(code, {
            lang: shikiLanguage,
            themes: { light: 'github-light', dark: 'github-dark' },
          });
        })
        .catch(() => {
          return getHighlighter('plaintext').then(highlighter =>
            highlighter.codeToHtml(code, {
              lang: 'plaintext',
              themes: { light: 'github-light', dark: 'github-dark' },
            }),
          );
        })
        .catch(() => {
          return createPlainCodeHtml(code);
        });
    }
  }
}
