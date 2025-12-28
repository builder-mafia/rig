import type { AllinAPI } from '@allin/api';

export interface Extension {
  /** Unique extension ID */
  id: string;
  /** Extension name */
  name: string;
  /** Extension version */
  version: string;
  /** Extension description */
  description?: string;
  activate(api: AllinAPI): void | Promise<void>;
  deactivate?(api: AllinAPI): void | Promise<void>;
}
