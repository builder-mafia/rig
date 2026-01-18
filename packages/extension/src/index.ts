import type { ExtensionContext } from '@allin/context';

export type Extension = (context: ExtensionContext) => {
  /** Unique extension ID */
  id: string;
  /** Extension name */
  name: string;
  /** Extension version */
  version: string;
  /** Extension description */
  description?: string;
};
