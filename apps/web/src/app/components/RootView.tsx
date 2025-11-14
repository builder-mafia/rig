import { Google, OpenAI } from '@lobehub/icons';
import { randomUUID } from 'crypto';
import {
  ChartArea,
  ChevronDown,
  Key,
  KeyRound,
  Lock,
  MessageCirclePlus,
  Sidebar,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useLayoutEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Textarea } from '@/components/ui/textarea';
import { createChatFacade } from '@/core/chat/ChatFacade';
import { generateUIMessage } from '@/core/helper';
import { DB } from '@/idb/db';
import { ChatInput } from './ChatInput';
import { ApiKeyConfigModal } from './modal/ApiKeyConfigModal';
import { ApiKeyFormModal } from './modal/ApiKeyFormModal';

export const RootView = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isApiKeyConfigModalOpen, setIsApiKeyConfigModalOpen] = useState(false);

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

  const onSubmit = async (input: string) => {
    const { googleApiKey, openaiApiKey } = await DB.getConfig();

    const chatFacade = createChatFacade(
      googleApiKey || '',
      'google',
      'gemini-2.5-flash',
      {
        id: '111',
        messages: [],
        onData: () => {},
        onFinish: () => {},
        onError: () => {},
      },
    );

    chatFacade.getChatTransport().sendMessage(generateUIMessage('user', input));

    chatFacade
      .getUiMessageStore()
      .uiMessages$()
      .subscribe(uiMessages => {
        console.log(uiMessages);
      });
  };

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
        <ApiKeyFormModal
          open={isApiKeyModalOpen}
          onOpenChange={setIsApiKeyModalOpen}
        />
        <ChatInput onSubmit={onSubmit} />
      </motion.div>
    </div>
  );
};
