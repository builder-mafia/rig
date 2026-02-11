import { filter, Subject, take } from 'rxjs';
import { getHighlighter } from './getHighlighter';
import type { ShikiWorkerRequest, ShikiWorkerResponse } from './shiki-worker';

// pre-builded worker file path
const WORKER_PATH = '/workers/shiki-worker.js';

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

  public highlight(code: string, language: string): Promise<string> {
    if (this.useWorker) {
      const worker = this.getWorker();

      this.requestIdCounter += 1;
      const requestId = this.requestIdCounter;
      const payload: ShikiWorkerRequest = {
        id: requestId,
        code,
        language,
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
              reject(new Error(response.error));
              return;
            }
            resolve(response.html);
          });
      });
    } else {
      return getHighlighter(language).then(highlighter => {
        return highlighter.codeToHtml(code, {
          lang: language,
          themes: { light: 'github-light', dark: 'github-dark' },
        });
      });
    }
  }
}
