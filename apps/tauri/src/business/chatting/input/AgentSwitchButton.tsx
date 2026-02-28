import { Button, Kbd, KbdGroup } from '@allin/ui';
import { useAgent } from '@/business/agent/useAgent';
import { useService } from '@/business/ServiceContext';

export const AgentSwitchButton = () => {
  const { agentManager } = useService();
  const { selectedAgent } = useAgent();

  const hasSelectedAgent = selectedAgent !== null;

  return (
    <Button
      variant='ghost'
      size='sm'
      disabled={!hasSelectedAgent}
      className='text-xs text-muted-foreground'
      onClick={() => {
        agentManager.cycleSelectedAgent();
      }}
    >
      {hasSelectedAgent ? (
        <>
          <span className='font-bold'>{selectedAgent.name}</span>
          <span className='opacity-90'>{selectedAgent.model}</span>
          <span className='opacity-50'>{selectedAgent.providerName}</span>
        </>
      ) : (
        <span className='text-xs text-muted-foreground gap-1'>Add Agent</span>
      )}
      <KbdGroup>
        <Kbd>Tab</Kbd>
      </KbdGroup>
    </Button>
  );
};
