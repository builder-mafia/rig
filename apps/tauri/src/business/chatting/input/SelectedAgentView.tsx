import { Button } from '@allin/ui';
import { useAgent } from '@/business/agent/useAgent';

export const SelectedAgentView = () => {
  const { selectedAgent } = useAgent();

  return (
    <>
      {selectedAgent ? (
        <>
          {selectedAgent.name}
          <span className='opacity-50'>{selectedAgent.model}</span>
        </>
      ) : (
        <Button
          variant='ghost'
          size='sm'
          className='text-xs text-muted-foreground gap-1'
        >
          Add Agent
        </Button>
      )}
    </>
  );
};
