'use client';

import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { AgentManager } from './agent/AgentManager';
import { ChannelManager } from './chatting/channel/ChannelManager';
import { ChatFacadeManager } from './chatting/facade/ChatFacadeManager';
import { ChatInputState } from './chatting/input/ChatInputState';
import { CommandPaletteManager } from './command-palette/CommandPaletteManager';
import { SlashCommandManager } from './slash-command/SlashCommandManager';

export type Services = {
  agentManager: AgentManager;
  channelManager: ChannelManager;
  chatFacadeManager: ChatFacadeManager;
  chatInputState: ChatInputState;
  commandPaletteManager: CommandPaletteManager;
  slashCommandManager: SlashCommandManager;
};

const ServiceContext = createContext<Services | null>(null);

export const createServices = (): Services => {
  const agentManager = AgentManager.getInstance();
  const channelManager = ChannelManager.getInstance();
  const chatFacadeManager = ChatFacadeManager.getInstance();
  const chatInputState = ChatInputState.getInstance();
  const commandPaletteManager = CommandPaletteManager.getInstance();
  const slashCommandManager = SlashCommandManager.getInstance();

  return {
    agentManager,
    channelManager,
    chatFacadeManager,
    chatInputState,
    commandPaletteManager,
    slashCommandManager,
  };
};

type ServiceProviderProps = {
  children: ReactNode;
  value?: Services;
};

export const ServiceProvider = ({ children, value }: ServiceProviderProps) => {
  const defaultServices = useMemo(() => createServices(), []);

  return (
    <ServiceContext.Provider value={value ?? defaultServices}>
      {children}
    </ServiceContext.Provider>
  );
};

export const useService = (): Services => {
  const ctx = useContext(ServiceContext);
  if (!ctx) {
    throw new Error('useService must be used within ServiceProvider');
  }
  return ctx;
};
