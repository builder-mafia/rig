import {
  ChevronDown,
  KeyRound,
  MessageCirclePlus,
  Sidebar as SidebarIcon,
} from 'lucide-react';
import { AnimatePresence, motion, noop } from 'motion/react';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type z from 'zod';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getProviderFromModel,
  type LLMModel,
  LLMModelMap,
} from '@/core/chat/ai-model';
import { createChatFacade } from '@/core/chat/ChatFacade';
import { ChatFacadeManager } from '@/core/chat/ChatFacadeManager';
import { useChat } from '@/core/chat/useChat';
import { generateUIMessage, messagesToThreads } from '@/core/helper';
import {
  type ChannelSchema,
  type ConfigSchema,
  DB,
  type DB_MESSAGE,
} from '@/idb/db';
import { useChannelMutation } from '@/idb/useChanelMutation';
import { useChannel } from '@/idb/useChannel';
import { useChannelCreate } from '@/idb/useChannelCreate';
import { useConfig } from '@/idb/useConfig';
import { useConfigMutation } from '@/idb/useConfigMutation';
import { useMessages } from '@/idb/useMessages';
import { cn } from '@/lib/utils';
import type { Nullable } from '@/utils/nullable';
import { ChatInput } from './ChatInput';
import { Chatting } from './Chatting';
import { ModalRegistry } from './modal/ModalRegistry';
import { modalManager } from './modal/modalManager';
import { Sidebar } from './Sidebar';

type RootViewProps = {
  initialData: {
    channels: z.infer<typeof ChannelSchema>[];
    messages: DB_MESSAGE[];
    config: z.infer<typeof ConfigSchema>;
  };
};

const canUseChatFacade = (
  currentChannel: Nullable<z.infer<typeof ChannelSchema>>,
  config: Nullable<z.infer<typeof ConfigSchema>>,
) => {
  if (
    currentChannel?.model &&
    config?.lastSelectedChannelId &&
    (config?.googleApiKey || config?.openaiApiKey)
  ) {
    return true;
  }
  return false;
};

const isValid = (
  target: unknown,
  validator: z.ZodSchema<unknown>,
): {
  success: boolean;
  result: z.infer<typeof validator> | undefined;
  error: string | undefined;
} => {
  const result = validator.safeParse(target);
  return {
    result: result.data,
    success: result.success,
    error: result.error?.message ?? undefined,
  };
};

export const RootView = ({ initialData }: RootViewProps) => {
  const { mutate: createChannel } = useChannelCreate();
  const { mutate: updateConfig } = useConfigMutation();
  useEffect(() => {
    if (!initialData.config.lastSelectedChannelId) {
      const id = uuidv4();
      createChannel({
        id,
        createdAt: Date.now(),
        isEmpty: true,
      });

      updateConfig({ lastSelectedChannelId: id });
    }
  }, [initialData.config.lastSelectedChannelId]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: config } = useConfig();
  const { mutate: updateChannel } = useChannelMutation();
  // if lastSelectedChannelId is empty, it will return undefined.
  const { data: currentChannel } = useChannel(
    config?.lastSelectedChannelId ?? '',
  );

  const chatFacade = useMemo(() => {
    // (TODO) L79: change to `isValid` with zod schema for more explicit error handling. (we can use description to show the error message.)
    if (canUseChatFacade(currentChannel, config)) {
      const provider = getProviderFromModel(currentChannel!.model!);
      if (ChatFacadeManager.hasChatFacade(currentChannel!.id)) {
        return ChatFacadeManager.getChatFacade(currentChannel!.id);
      }
      const facade = createChatFacade(
        provider === 'google' ? config!.googleApiKey! : config!.openaiApiKey!,
        provider,
        currentChannel!.model!,
        {
          id: currentChannel!.id,
          messages: [],
          onData: noop,
          onFinish: noop,
          onError: noop,
        },
      );
      ChatFacadeManager.setChatFacade(currentChannel!.id, facade);
      return facade;
    }
    return null;
  }, [currentChannel, config]);

  const { sendMessage, uiMessages, status, isInitialized } =
    useChat(chatFacade);

  const onChangeSelectedModel = (model: LLMModel) => {
    updateChannel({ id: currentChannel!.id, channel: { model } });
  };

  const onSubmit = (input: string) => {
    sendMessage(generateUIMessage('user', input));
  };

  const threads = useMemo(() => messagesToThreads(uiMessages), [uiMessages]);

  return (
    <div className={cn('w-full h-full flex flex-row')}>
      <ModalRegistry />
      <div className='absolute top-1 left-2 flex '>
        <Button
          variant={'outline'}
          size={'icon'}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <SidebarIcon />
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
                onClick={() => modalManager.openModal('apiKeyConfig')}
              >
                <KeyRound />
                My API Key
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <AnimatePresence>{isSidebarOpen && <Sidebar />}</AnimatePresence>
      <motion.div
        layout={'size'}
        className='flex-1 h-full bg-background justify-center items-center flex'
      >
        <Chatting threads={threads} status={status} />
        <ChatInput
          onSubmit={onSubmit}
          onChangeSelectedModel={onChangeSelectedModel}
        />
      </motion.div>
    </div>
  );
};
