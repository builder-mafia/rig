'use client';

import { useAtomValue } from 'jotai';
import { ApiKeyConfigModal } from './ApiKeyConfigModal';
import { ApiKeyFormModal } from './ApiKeyFormModal';
import { modalManager } from './modalManager';
import { openModalIdsAtom } from './modalStore';

/**
 * Mounts all modals.
 * This component should be rendered only once at the root level.
 */
export const ModalRegistry = () => {
  const openModalIds = useAtomValue(openModalIdsAtom);

  return (
    <>
      <ApiKeyConfigModal
        open={openModalIds.has('apiKeyConfig')}
        onOpenChange={open => {
          if (open) {
            modalManager.openModal('apiKeyConfig');
          } else {
            modalManager.closeModal('apiKeyConfig');
          }
        }}
      />
      <ApiKeyFormModal
        open={openModalIds.has('apiKeyForm')}
        onOpenChange={open => {
          if (open) {
            modalManager.openModal('apiKeyForm');
          } else {
            modalManager.closeModal('apiKeyForm');
          }
        }}
      />
    </>
  );
};
