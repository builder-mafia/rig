import { atom } from 'jotai';

export type ContentType = 'content' | 'create-entry' | 'new-user';

/**
 * The type of the content that is being displayed in the content area.
 */
export const contentTypeAtom = atom<ContentType>('new-user');
