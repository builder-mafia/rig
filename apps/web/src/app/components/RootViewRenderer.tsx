import { Suspense } from 'react';
import { useSwrAtomValue } from '@/hooks/use-swr-atom-value';
import { dbAtoms } from '@/idb/db-store';
import { ApiKeyFormModal } from './modal/ApiKeyFormModal';
import { RootView } from './RootView';

export const RootViewRenderer = () => {
  const selectedChannel = useSwrAtomValue(dbAtoms.selectedChannelAtom);
  return (
    <>
      {selectedChannel ? (
        <Suspense fallback={<div></div>}>
          <RootView />
        </Suspense>
      ) : (
        <div>
          {/* they need to enter api key to use the service. user can't close this modal. */}
          <ApiKeyFormModal open={true} onOpenChange={() => {}} />
        </div>
      )}
    </>
  );
};
