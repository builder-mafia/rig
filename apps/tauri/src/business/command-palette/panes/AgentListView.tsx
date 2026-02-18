'use client';

import type { ProviderId } from '@allin/ai';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  toast,
} from '@allin/ui';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState, useSyncExternalStore } from 'react';
import type { Agent } from '@/business/agent/types';
import { useCommandPalette } from '@/business/command-palette/useCommandPalette';
import { getProviderIcon } from '@/business/logo/ProviderIconMap';
import { useService } from '@/business/ServiceContext';

export const AgentListView = () => {
  const { agentManager } = useService();
  const { navigate, close } = useCommandPalette();
  const [value, setValue] = useState('');

  const subscribeToAgents = useCallback(
    (onChange: () => void) => {
      const sub = agentManager.agents$.subscribe(onChange);
      return () => sub.unsubscribe();
    },
    [agentManager],
  );
  const agents = useSyncExternalStore<Agent[]>(
    subscribeToAgents,
    () => agentManager.agents,
    () => agentManager.agents,
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close();
      setValue('');
    }
  };

  const handleDelete = async (agent: Agent) => {
    try {
      await agentManager.delete(agent.id);
      toast.success(`Deleted "${agent.name}"`, {
        position: 'top-center',
        duration: 2000,
      });
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : `Failed to delete agent. ${e}`,
        {
          position: 'top-center',
          duration: 5000,
        },
      );
    }
  };

  return (
    <CommandDialog
      open
      onOpenChange={handleOpenChange}
      value={value}
      onValueChange={setValue}
    >
      <CommandInput placeholder='Search agents...' />
      <CommandEmpty>No agents found.</CommandEmpty>
      <CommandList>
        <CommandGroup
          heading={<span className='text-blue-500 font-semibold'>Agents</span>}
        >
          <CommandItem onSelect={() => navigate('agent-create')}>
            <Plus className='size-4' />
            <span>Create Agent</span>
          </CommandItem>

          {agents.map(agent => (
            <CommandItem
              key={agent.id}
              value={agent.name}
              className='flex items-center justify-between'
            >
              <div className='flex items-center gap-2'>
                {getProviderIcon(agent.providerName as ProviderId, 'size-4')}
                <span>{agent.name}</span>
                <span className='text-xs text-muted-foreground'>
                  {agent.model}
                </span>
              </div>

              <div className='flex items-center gap-1'>
                <button
                  type='button'
                  className='p-1 rounded hover:bg-accent'
                  onClick={e => {
                    e.stopPropagation();
                    navigate('agent-create', { agentId: agent.id });
                  }}
                >
                  <Pencil className='size-3' />
                </button>
                <button
                  type='button'
                  className='p-1 rounded hover:bg-destructive/10 text-destructive'
                  onClick={e => {
                    e.stopPropagation();
                    handleDelete(agent).catch(console.error);
                  }}
                >
                  <Trash2 className='size-3' />
                </button>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
