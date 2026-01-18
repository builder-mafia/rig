'use client';

import { useChat } from '@ai-sdk/react';
import { invoke } from '@tauri-apps/api/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChatInput } from '../business/chat/ChatInput';
import { TauriChatTransport } from '../chat/tauri-chat-transport';

// Storage types
interface ChannelInfo {
  id: string;
  model: string;
  providerName: string;
  reasoningEffort: string;
  reasoningSummary: boolean;
  title: string | null;
  description: string | null;
  prompt: string | null;
  isEmpty: boolean;
  pin: string | null;
  createdAt: number;
  updatedAt: number;
}

interface StorageMessage {
  id: string;
  role: string;
  parts: Array<{ type: string; text?: string; [key: string]: unknown }>;
  createdAt?: number;
}

// Helper function to generate unique IDs
const generateId = () => crypto.randomUUID();

export default function Home() {
  const [showSettings, setShowSettings] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Channel state
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);

  // Create Tauri transport instance
  const transport = useMemo(() => new TauriChatTransport(), []);

  // useChat with custom Tauri transport
  const { messages, status, sendMessage, setMessages } = useChat({
    id: currentChannelId ?? undefined,
    transport,
    onFinish: async () => {
      // Save messages when stream finishes
      if (currentChannelId) {
        await saveMessagesToStorage(currentChannelId);
      }
    },
    onError: (error: Error) => {
      console.error('Chat error:', error);
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Save messages to storage
  const saveMessagesToStorage = useCallback(
    async (channelId: string) => {
      try {
        const storageMessages: StorageMessage[] = messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          parts: msg.parts.map(p => ({
            type: p.type,
            text: 'text' in p ? p.text : undefined,
          })),
          createdAt: Date.now(),
        }));

        console.log('storageMes sages:', storageMessages);
        await invoke('save_messages', {
          channelId,
          messages: storageMessages,
        });
      } catch (error) {
        console.log('error:', error);
        console.error('Failed to save messages:', error);
      }
    },
    [messages],
  );

  const checkApiKey = useCallback(async () => {
    try {
      const hasKey = await invoke<boolean>('has_api_key');
      setHasApiKey(hasKey);
    } catch (error) {
      console.error('Failed to check API key:', error);
      setHasApiKey(false);
    }
  }, []);

  // Load channels on mount
  const loadChannels = useCallback(async () => {
    try {
      const channelList = await invoke<ChannelInfo[]>('get_channels');
      setChannels(channelList);

      // If no current channel, create one or select the first
      if (!currentChannelId && channelList.length === 0) {
        await createNewChannel();
      } else if (!currentChannelId && channelList.length > 0) {
        setCurrentChannelId(channelList[0].id);
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  }, [currentChannelId]);

  // Create a new channel
  const createNewChannel = useCallback(async () => {
    const newChannel: ChannelInfo = {
      id: generateId(),
      model: 'gpt-4',
      providerName: 'openai',
      reasoningEffort: 'none',
      reasoningSummary: false,
      title: null,
      description: null,
      prompt: null,
      isEmpty: true,
      pin: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await invoke('create_channel', { info: newChannel });
      setChannels(prev => [newChannel, ...prev]);
      setCurrentChannelId(newChannel.id);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create channel:', error);
    }
  }, [setMessages]);

  // Load messages for current channel
  const loadMessages = useCallback(
    async (channelId: string) => {
      try {
        const storedMessages = await invoke<StorageMessage[]>('get_messages', {
          channelId,
        });

        // Convert storage messages to UIMessage format
        const uiMessages = storedMessages.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          parts: msg.parts.map(p => ({
            type: p.type as 'text',
            text: p.text || '',
          })),
        }));

        setMessages(uiMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
        setMessages([]);
      }
    },
    [setMessages],
  );

  useEffect(() => {
    checkApiKey();
    loadChannels();
  }, [checkApiKey, loadChannels]);

  // Load messages when channel changes
  useEffect(() => {
    if (currentChannelId) {
      loadMessages(currentChannelId);
    }
  }, [currentChannelId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim() || isSavingKey) return;

    setIsSavingKey(true);
    setSettingsMessage(null);

    try {
      await invoke('save_api_key', { apiKey: apiKeyInput.trim() });
      setApiKeyInput('');
      setHasApiKey(true);
      setSettingsMessage({
        type: 'success',
        text: 'API key saved successfully!',
      });
      setTimeout(() => {
        setShowSettings(false);
        setSettingsMessage(null);
      }, 1500);
    } catch (error) {
      setSettingsMessage({
        type: 'error',
        text: `Failed to save API key: ${error}`,
      });
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (isSavingKey) return;

    setIsSavingKey(true);
    setSettingsMessage(null);

    try {
      await invoke('delete_api_key');
      setHasApiKey(false);
      setSettingsMessage({
        type: 'success',
        text: 'API key deleted successfully!',
      });
    } catch (error) {
      setSettingsMessage({
        type: 'error',
        text: `Failed to delete API key: ${error}`,
      });
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!currentChannelId) return;
      await sendMessage({ text });
    },
    [currentChannelId, sendMessage],
  );

  // Helper to get text content from message
  const getMessageText = (message: (typeof messages)[number]): string => {
    return message.parts
      .filter(
        (part): part is { type: 'text'; text: string } => part.type === 'text',
      )
      .map(part => part.text)
      .join('');
  };

  return (
    <div className='flex h-screen flex-col bg-zinc-50 font-sans dark:bg-zinc-900'>
      {/* Settings Modal */}
      {showSettings && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-lg font-semibold text-zinc-800 dark:text-zinc-100'>
                Settings
              </h2>
              <button
                type='button'
                onClick={() => {
                  setShowSettings(false);
                  setSettingsMessage(null);
                  setApiKeyInput('');
                }}
                className='text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-6 w-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>

            <div className='space-y-4'>
              <div>
                <span className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                  OpenAI API Key
                </span>
                <div className='mb-2 flex items-center gap-2'>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      hasApiKey
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}
                  >
                    {hasApiKey ? 'Configured' : 'Not configured'}
                  </span>
                </div>
                <form onSubmit={handleSaveApiKey} className='space-y-3'>
                  <input
                    type='password'
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    placeholder={
                      hasApiKey
                        ? 'Enter new API key to update'
                        : 'Enter your OpenAI API key'
                    }
                    className='w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-800 placeholder-zinc-400 focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500'
                  />
                  <div className='flex gap-2'>
                    <button
                      type='submit'
                      disabled={!apiKeyInput.trim() || isSavingKey}
                      className='flex-1 rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      {isSavingKey ? 'Saving...' : 'Save API Key'}
                    </button>
                    {hasApiKey && (
                      <button
                        type='button'
                        onClick={handleDeleteApiKey}
                        disabled={isSavingKey}
                        className='rounded-lg bg-red-500 px-4 py-2 font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50'
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {settingsMessage && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    settingsMessage.type === 'success'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}
                >
                  {settingsMessage.text}
                </div>
              )}

              <p className='text-xs text-zinc-500 dark:text-zinc-400'>
                Your API key is securely stored in your system&apos;s keychain
                and never leaves your device.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className='border-b border-zinc-200 p-4 dark:border-zinc-700'>
        <div className='flex items-center justify-between'>
          <button
            type='button'
            onClick={createNewChannel}
            className='rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-300'
            title='New Chat'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 4v16m8-8H4'
              />
            </svg>
          </button>
          <h1 className='text-xl font-semibold text-zinc-800 dark:text-zinc-100'>
            AI Chat
          </h1>
          <button
            type='button'
            onClick={() => setShowSettings(true)}
            className='rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-300'
            title='Settings'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className='flex-1 overflow-y-auto p-4'>
        <div className='mx-auto max-w-3xl space-y-4'>
          {messages.length === 0 && (
            <div className='py-8 text-center text-zinc-500'>
              Start a conversation by typing a message below.
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100'
                }`}
              >
                <pre className='whitespace-pre-wrap font-sans'>
                  {getMessageText(message)}
                </pre>
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className='flex justify-start'>
              <div className='rounded-lg bg-zinc-200 px-4 py-2 dark:bg-zinc-700'>
                <span className='animate-pulse text-zinc-500'>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        disabled={!currentChannelId}
      />
    </div>
  );
}
