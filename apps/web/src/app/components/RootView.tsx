import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  KeyRound,
  MessageCirclePlus,
  Sidebar,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createChatFacade } from '@/core/chat/ChatFacade';
import { useChat } from '@/core/chat/useChat';
import { generateUIMessage, messagesToThreads } from '@/core/helper';
import { DB } from '@/idb/db';
import { useConfig } from '@/idb/useConfig';
import { Thread } from '../main/chat/Thread';
import { ChatInput } from './ChatInput';
import { ApiKeyConfigModal } from './modal/ApiKeyConfigModal';
import { ApiKeyFormModal } from './modal/ApiKeyFormModal';

export const RootView = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isApiKeyConfigModalOpen, setIsApiKeyConfigModalOpen] = useState(false);
  const { data: config } = useConfig();

  const chatFacade = useMemo(() => {
    return createChatFacade(undefined, undefined, undefined, {
      id: '1234',
      messages: [],
      onData: () => {},
      onFinish: () => {},
      onError: e => {
        console.log(e.message, e.cause, e.name);
      },
    });
  }, []);

  const { sendMessage, uiMessages, status } = useChat(chatFacade);

  useEffect(() => {
    if (config?.openaiApiKey) {
      chatFacade.setLLMModel('openai', 'gpt-4.1', config.openaiApiKey);
    }
  }, [config]);

  useLayoutEffect(() => {
    const checkIfHasApiKey = async () => {
      const { googleApiKey, openaiApiKey } = await DB.getConfig();

      return !!(googleApiKey || openaiApiKey);
    };

    checkIfHasApiKey().then(hasApiKey => {
      if (!hasApiKey) {
        setIsApiKeyModalOpen(true);
      }
    });
  }, []);

  const onSubmit = (input: string) => {
    sendMessage(generateUIMessage('user', input));
  };

  const threads = messagesToThreads([...uiMessages]);

  return (
    <div className='w-full h-full flex flex-row'>
      <ApiKeyConfigModal
        open={isApiKeyConfigModalOpen}
        onOpenChange={setIsApiKeyConfigModalOpen}
      />
      <div className='absolute top-1 left-2 flex '>
        <Button
          variant={'outline'}
          size={'icon'}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Sidebar />
        </Button>
      </div>
      <div className='absolute px-1 top-2 right-4 flex rounded-2xl dark:bg-input/30 dark:border-input'>
        <Button
          variant={'ghost'}
          size={'icon'}
          className='rounded-full'
          onClick={() => {}}
        >
          <MessageCirclePlus />
        </Button>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant={'ghost'}
              size={'icon'}
              className='rounded-full'
              onClick={() => {}}
            >
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-56' align='start'>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => setIsApiKeyConfigModalOpen(true)}
              >
                <KeyRound />
                My API Key
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 360 }}
            exit={{ width: 0 }}
            transition={{ ease: 'easeInOut', duration: 0.16 }}
            className='h-full bg-blue-200 overflow-hidden'
          />
        )}
      </AnimatePresence>
      <motion.div
        layout={'size'}
        className='flex-1 h-full bg-background justify-center items-center flex'
      >
        <div className='w-full h-full flex flex-col'>
          <div className='p-4 gap-4 flex flex-col'>
            {threads.map((thread, index) => (
              <Thread
                key={`thread-${index}`}
                thread={thread}
                isLast={threads.length - 1 === index}
                status={status}
              ></Thread>
            ))}
          </div>
        </div>
        <ChatInput onSubmit={onSubmit} />
      </motion.div>
      <ApiKeyFormModal
        open={isApiKeyModalOpen}
        onOpenChange={setIsApiKeyModalOpen}
      />
    </div>
  );
};
