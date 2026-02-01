'use client';

import { Toaster } from '@allin/ui';
import { ChattingView } from '@/business/chatting/ChattingView';
import { CommandSetting } from '@/business/settings/CommandSetting';

export default function Home() {
  return (
    <div>
      <Toaster richColors duration={3000} />
      <CommandSetting />
      <ChattingView />
    </div>
  );
}
