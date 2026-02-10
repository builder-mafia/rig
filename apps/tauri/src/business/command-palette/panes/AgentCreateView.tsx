'use client';

import {
  MODEL_IDS_PER_PROVIDER,
  PROVIDER_IDS,
  type ProviderId,
} from '@allin/ai';
import {
  Button,
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
import { useState } from 'react';
import { AgentManager } from '@/business/agent/AgentManager';
import { useCommandPalette } from '@/business/command-palette/useCommandPalette';
import { getProviderIcon } from '@/business/logo/ProviderIconMap';
import { agentGateway } from '@/lib/gateway/agent/agentGateway';
import type { StorageAgent } from '../../chatting/storage/types';

type AgentCreateViewProps = Record<string, unknown>;

export const AgentCreateView = (props: AgentCreateViewProps) => {
  const { close } = useCommandPalette();
  const agentId = props.agentId as string | undefined;
  const isEditMode = Boolean(agentId);

  const [name, setName] = useState('');
  const [providerName, setProviderName] = useState<ProviderId>('openai');
  const [model, setModel] = useState<string>(MODEL_IDS_PER_PROVIDER.openai[0]);
  const [prompt, setPrompt] = useState('');
  const [nameError, setNameError] = useState('');
  const [loaded, setLoaded] = useState(!isEditMode);
  const [originalAgent, setOriginalAgent] = useState<StorageAgent | null>(null);

  if (isEditMode && !loaded && agentId) {
    agentGateway.get(agentId)
      .then(agent => {
        setName(agent.name);
        setProviderName(agent.providerName as ProviderId);
        setModel(agent.model);
        setPrompt(agent.prompt ?? '');
        setOriginalAgent(agent);
        setLoaded(true);
      })
      .catch(() => {
        toast.error('Failed to load agent');
        close();
      });
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

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Name is required');
      return;
    }
    setNameError('');

    const now = Date.now();

    if (isEditMode && originalAgent) {
      const updated: StorageAgent = {
        ...originalAgent,
        name: trimmedName,
        providerName,
        model,
        prompt: prompt.trim() || null,
        updatedAt: now,
      };
      await agentGateway.update(updated);
    } else {
      const agent: StorageAgent = {
        id: crypto.randomUUID(),
        name: trimmedName,
        providerName,
        model,
        prompt: prompt.trim() || null,
        createdAt: now,
        updatedAt: now,
      };
      await agentGateway.create(agent);
    }

    await AgentManager.getInstance().reload();
    toast.success(isEditMode ? 'Agent updated' : 'Agent created', {
      position: 'top-center',
      duration: 2000,
    });
    close();
  };

  const models = MODEL_IDS_PER_PROVIDER[providerName];

  if (!loaded) return null;

  return (
    <CommandDialog open onOpenChange={handleOpenChange} showCloseButton={false}>
      <CommandList>
        <div className='p-4 flex flex-col gap-4'>
          <h3 className='font-semibold'>
            {isEditMode ? 'Edit Agent' : 'Create Agent'}
          </h3>

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
                  <SelectItem key={id} value={id}>
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
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder='You are a helpful assistant...'
              className='min-h-20 max-h-40'
            />
          </div>

          <div className='flex justify-end'>
            <Button size='sm' onClick={handleSave}>
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </CommandList>
    </CommandDialog>
  );
};
