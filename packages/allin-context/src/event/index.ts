import type { Observable } from 'rxjs';

export interface Event {
  'extension.loaded': (id: string) => Observable<{
    id: string;
    name: string;
  }>;
  'extension.activate': (id: string) => Observable<{
    id: string;
    name: string;
  }>;
  'extension.deactivate': (id: string) => Observable<{
    id: string;
    name: string;
  }>;
  'extension.open': (id: string) => Observable<{
    id: string;
    name: string;
  }>;
  'extension.close': (id: string) => Observable<{
    id: string;
    name: string;
  }>;
}
