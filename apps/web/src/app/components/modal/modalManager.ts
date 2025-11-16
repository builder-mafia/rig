import { getDefaultStore } from 'jotai';
import type { ModalId } from './modalStore';
import { openModalIdsAtom } from './modalStore';

export class ModalManager {
  private static instance: ModalManager;

  private constructor() {}

  static getInstance(): ModalManager {
    if (!ModalManager.instance) {
      ModalManager.instance = new ModalManager();
    }
    return ModalManager.instance;
  }

  /**
   * Returns the set of currently open modal IDs.
   */
  getOpenModalIds(): Set<ModalId> {
    return getDefaultStore().get(openModalIdsAtom);
  }

  /**
   * Opens a specific modal.
   */
  openModal(id: ModalId): void {
    const store = getDefaultStore();
    const currentIds = store.get(openModalIdsAtom);
    const newIds = new Set(currentIds);
    newIds.add(id);
    store.set(openModalIdsAtom, newIds);
  }

  /**
   * Closes a specific modal.
   */
  closeModal(id: ModalId): void {
    const store = getDefaultStore();
    const currentIds = store.get(openModalIdsAtom);
    const newIds = new Set(currentIds);
    newIds.delete(id);
    store.set(openModalIdsAtom, newIds);
  }

  /**
   * Checks if a specific modal is open.
   */
  isModalOpen(id: ModalId): boolean {
    return getDefaultStore().get(openModalIdsAtom).has(id);
  }

  /**
   * Closes all modals.
   */
  closeAllModals(): void {
    getDefaultStore().set(openModalIdsAtom, new Set());
  }
}

export const modalManager = ModalManager.getInstance();
