'use client';

import { invoke } from '@tauri-apps/api/core';
import type { StorageAgent, StorageChannel, StorageMessage } from './types';

export async function getChannels(): Promise<StorageChannel[]> {
  return invoke('get_channels');
}

export async function createChannel(info: StorageChannel): Promise<void> {
  await invoke('create_channel', { info });
}

export async function getChannel(id: string): Promise<StorageChannel> {
  return invoke('get_channel', { id });
}

export async function getMessages(
  channelId: string,
): Promise<StorageMessage[]> {
  return invoke('get_messages', { channelId });
}

export async function appendMessage(
  channelId: string,
  message: StorageMessage,
): Promise<void> {
  await invoke('append_message', { channelId, message });
}

export async function upsertMessage(
  channelId: string,
  message: StorageMessage,
): Promise<void> {
  await invoke('upsert_message', { channelId, message });
}

export async function getAgent(id: string): Promise<StorageAgent> {
  return invoke('get_agent', { id });
}

export async function getAllAgents(): Promise<StorageAgent[]> {
  return invoke('get_all_agents');
}
