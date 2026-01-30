'use client';

import { Toaster } from '@allin/ui';
import { ChatInputView } from '@/business/chat/ChatInputView';
import { CommandSetting } from '@/business/settings/CommandSetting';

export default function Home() {
  return (
    <div>
      <Toaster richColors duration={3000} />
      <CommandSetting />
      <ChatInputView session={null} />
    </div>
  );
}
