'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { AgentManager } from './agent/AgentManager';
import { ChannelManager } from './chatting/channel/ChannelManager';
import { ChatFacadeManager } from './chatting/facade/ChatFacadeManager';
import { CommandPaletteManager } from './command-palette/CommandPaletteManager';
import { ConfigFileManager } from './config-file/ConfigFileManager';
import { SlashCommandManager } from './slash-command/SlashCommandManager';

export type Services = {
  agentManager: AgentManager;
  channelManager: ChannelManager;
  chatFacadeManager: ChatFacadeManager;
  commandPaletteManager: CommandPaletteManager;
  configFileManager: ConfigFileManager;
  slashCommandManager: SlashCommandManager;
};

const ServiceContext = createContext<Services | null>(null);

export const createServices = (): Services => {
  const agentManager = AgentManager.getInstance();
  const channelManager = ChannelManager.getInstance();
  const chatFacadeManager = ChatFacadeManager.getInstance();
  const commandPaletteManager = CommandPaletteManager.getInstance();
  const configFileManager = ConfigFileManager.getInstance();
  const slashCommandManager = SlashCommandManager.getInstance();

  return {
    agentManager,
    channelManager,
    chatFacadeManager,
    commandPaletteManager,
    configFileManager,
    slashCommandManager,
  };
};

type ServiceProviderProps = {
  children: ReactNode;
  value?: Services;
};

export const ServiceProvider = ({ children, value }: ServiceProviderProps) => {
  const defaultServices = useMemo(() => createServices(), []);

  // for DEBUG
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as unknown as { _services: Services })._services =
        defaultServices;
    }
  }, [defaultServices]);

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
