import type { Observable } from 'rxjs';

export interface Event {
  'extension.loaded': Observable<{
    id: string;
    name: string;
  }>;
  'extension.activate': Observable<{
    id: string;
    name: string;
  }>;
  'extension.deactivate': Observable<{
    id: string;
    name: string;
  }>;
  'extension.open': Observable<{
    id: string;
    name: string;
  }>;
  'extension.close': Observable<{
    id: string;
    name: string;
  }>;
}
