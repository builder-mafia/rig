'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@allin/ui';
import { HelpCircle, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState } from 'react';
import { extensionOpen$ } from '@/extension/loader';
import { RootViewRenderComponent$ } from '../RootView';

interface ExtensionItem {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const extensions: ExtensionItem[] = [
  {
    id: 'chat',
    name: 'Chat',
    icon: <MessageSquare className='w-full h-full' />,
  },
  {
    id: 'quiz',
    name: 'Quiz',
    icon: <HelpCircle className='w-full h-full' />,
  },
];

interface DockItemProps {
  extension: ExtensionItem;
  isHovered: boolean;
}

const DockItem = ({ extension, isHovered }: DockItemProps) => {
  const handleClick = () => {
    // if the extension is chat, close other extensions.
    if (extension.id === 'chat') {
      RootViewRenderComponent$.next(null);
      return;
    }

    extensionOpen$.next({
      id: extension.id,
      name: extension.name,
    });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          onClick={handleClick}
          animate={{
            width: isHovered ? 44 : 40,
            height: isHovered ? 44 : 40,
          }}
          transition={{
            type: 'spring',
            stiffness: 900,
            damping: 50,
          }}
          className='aspect-square rounded-xl 
                     bg-white/60 dark:bg-white/5
                     backdrop-blur-md
                     shadow-[0_4px_16px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.6)]
                     dark:shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]
                     flex items-center justify-center p-2
                     border border-white/40 dark:border-white/10
                     text-gray-600 dark:text-gray-300
                     hover:bg-white/80 dark:hover:bg-white/20
                     hover:text-gray-800 dark:hover:text-white
                     transition-colors duration-200'
        >
          {extension.icon}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent
        className='text-sm font-semibold'
        side='right'
        sideOffset={12}
      >
        {extension.name}
      </TooltipContent>
    </Tooltip>
  );
};

export const ExtensionDock = React.memo(() => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className='fixed left-3 top-1/2 -translate-y-1/2 z-50
                 flex flex-col items-center gap-2 
                 p-2 rounded-2xl
                 bg-white/30 dark:bg-background/10
                 backdrop-blur-sm backdrop-saturate-150
                 border border-white/50 dark:border-white/10
                 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]
                 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.2)]'
    >
      {extensions.map(extension => (
        <DockItem
          key={extension.id}
          extension={extension}
          isHovered={isHovered}
        />
      ))}
    </motion.div>
  );
});

ExtensionDock.displayName = 'ExtensionDock';
