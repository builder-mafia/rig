import type { ExtensionContext } from '@allin/context';

export interface Extension {
  /** Unique extension ID */
  id: string;
  /** Extension name */
  name: string;
  /** Extension version */
  version: string;
  /** Extension description */
  description?: string;
  activate(context: ExtensionContext): void | Promise<void>;
  deactivate?(context: ExtensionContext): void | Promise<void>;
}
