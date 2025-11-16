import { atom } from 'jotai';

export type ModalId = 'apiKeyConfig' | 'apiKeyForm';

export const openModalIdsAtom = atom<Set<ModalId>>(new Set<ModalId>());
