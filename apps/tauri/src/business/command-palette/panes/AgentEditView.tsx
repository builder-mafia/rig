'use client';

import {
  MODEL_IDS_PER_PROVIDER,
  PROVIDER_IDS,
  type ProviderId,
} from '@allin/ai';
import {
  Button,
  Command,
  CommandDialog,
  CommandList,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from '@allin/ui';
import { AssertionError } from '@allin/utils';
import { assert } from 'es-toolkit';
import { useState } from 'react';
import z from 'zod';
import { useAgent } from '@/business/agent/useAgent';
import { useCommandPalette } from '@/business/command-palette/useCommandPalette';
import { getProviderIcon } from '@/business/logo/ProviderIconMap';
import { useService } from '@/business/ServiceContext';
import { useApiKey } from '@/lib/gateway/api-key/useApiKeyQuery';
import { useCodexAuth } from '@/lib/gateway/codex-auth/useCodexAuth';

export const AgentEditViewPropsSchema = z.object({
  agentId: z.string(),
});

export type AgentEditViewProps = z.infer<typeof AgentEditViewPropsSchema>;

export const AgentEditView = ({ agentId }: AgentEditViewProps) => {
  const { agentManager } = useService();
  const { close } = useCommandPalette();
  const { getAgentById: findAgent } = useAgent();
  const agent = findAgent(agentId);
  const { apiKeyStatus } = useApiKey();
  const { isConnected: codexConnected } = useCodexAuth();

  assert(agent, new AssertionError('AgentEditView: agent not found'));

  const [name, setName] = useState(agent.name);
  const [providerName, setProviderName] = useState<ProviderId>(
    agent.providerName as ProviderId,
  );
  const [model, setModel] = useState<string>(agent.model);
  const [prompt, setPrompt] = useState(agent.prompt);
  const [nameError, setNameError] = useState('');

  if (!agent) {
    toast.error('Agent not found');
    close();
    return null;
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close();
    }
  };

  const handleProviderChange = (value: string) => {
    const newProvider = value as ProviderId;
    setProviderName(newProvider);
    setModel(MODEL_IDS_PER_PROVIDER[newProvider][0]);
  };

  const handleUpdate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Name is required');
      return;
    }
    setNameError('');

    await agentManager.update(agent.id, {
      name: trimmedName,
      providerName,
      model,
      prompt: prompt?.trim() ?? null,
    });
    toast.success('Agent updated', {
      position: 'top-center',
      duration: 2000,
    });
    close();
  };

  const models = MODEL_IDS_PER_PROVIDER[providerName];

  return (
    <CommandDialog open onOpenChange={handleOpenChange} showCloseButton={true}>
      <CommandList className='max-h-[min(500px,80dvh)] p-2'>
        <div className='p-4 flex flex-col gap-4'>
          <h3 className='font-semibold'>Edit Agent</h3>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='agent-name'>Name</Label>
            <Input
              id='agent-name'
              value={name}
              onChange={e => {
                setName(e.target.value);
                setNameError('');
              }}
              placeholder='My Agent'
              autoFocus
            />
            {nameError && (
              <span className='text-xs text-red-500'>{nameError}</span>
            )}
          </div>
          <div className='flex flex-col gap-2'>
            <Label>Provider</Label>
            <Select value={providerName} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_IDS.map(id => (
                  <SelectItem
                    key={id}
                    value={id}
                    disabled={
                      id === 'codex' ? !codexConnected : !apiKeyStatus?.[id]
                    }
                  >
                    <div className='flex items-center gap-2'>
                      {getProviderIcon(id, 'size-4')}
                      <span>{id}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-col gap-2'>
            <Label>Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map(m => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='agent-prompt'>System Prompt (optional)</Label>
            <Textarea
              id='agent-prompt'
              value={prompt ?? ''}
              onChange={e => setPrompt(e.target.value)}
              // cmdk's root onKeyDown calls e.preventDefault() on Enter to dispatch
              // its own cmdk-item-select event. This blocks Textarea's default Enter
              // (newline insertion). stopPropagation prevents the event from reaching
              // the Command root so the native behavior is preserved.
              onKeyDown={e => e.stopPropagation()}
              placeholder='You are a helpful assistant...'
              className='min-h-20 max-h-40'
            />
          </div>
          <div className='flex justify-end'>
            <Button
              size='sm'
              onClick={handleUpdate}
              // cmdk's root onKeyDown calls e.preventDefault() on Enter to dispatch
              // its own cmdk-item-select event. This blocks the browser's default
              // behavior of triggering a click on a focused button via Enter.
              // stopPropagation prevents the event from reaching the Command root.
              onKeyDown={e => e.stopPropagation()}
            >
              Update
            </Button>
          </div>
        </div>
      </CommandList>
    </CommandDialog>
  );
};
