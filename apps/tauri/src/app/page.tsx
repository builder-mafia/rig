'use client';

import { Toaster } from '@allin/ui';
import { ChatInput } from '@/business/chat/ChatInput';
import { CommandSetting } from '@/business/settings/CommandSetting';

export default function Home() {
  return (
    <div>
      <Toaster richColors duration={3000} />
      <CommandSetting />
      <ChatInput session={null} />
    </div>
  );
}
