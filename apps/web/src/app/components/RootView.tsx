import { Google, OpenAI } from '@lobehub/icons';
import {
  ChartArea,
  ChevronDown,
  Lock,
  MessageCirclePlus,
  Sidebar,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useLayoutEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Textarea } from '@/components/ui/textarea';
import { DB } from '@/idb/db';
import { ApiKeyFormModal } from './modal/ApiKeyFormModal';

export const RootView = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

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

  return (
    <div className='dark w-full h-full flex flex-row'>
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
        <Button
          variant={'ghost'}
          size={'icon'}
          className='rounded-full'
          onClick={() => {}}
        >
          <ChevronDown />
        </Button>
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
        <section className='absolute bottom-8 flex flex-col items-start gap-2'>
          <Textarea
            className='w-[800px] min-h-[40px] max-h-[500px]'
            placeholder='Ask AI Anything...'
          />
          <div className='flex flex-row'>
            <Button
              variant={'outline'}
              size='xs'
              className='py-2 px-1 gap-1 text-xs'
            >
              Submit
              <KbdGroup>
                <Kbd>⌘⏎</Kbd>
              </KbdGroup>
            </Button>
            <Button
              variant={'outline'}
              size='xs'
              className='py-2 px-1 gap-1 text-xs'
            >
              Actions
              <KbdGroup>
                <Kbd>⌘K</Kbd>
              </KbdGroup>
            </Button>
          </div>
        </section>
      </motion.div>
    </div>
  );
};
