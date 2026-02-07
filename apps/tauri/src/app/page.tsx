'use client';

import { Toaster } from '@allin/ui';
import { ChattingView } from '@/business/chatting/ChattingView';
import { CommandPalette } from '@/business/command-palette/CommandPalette';

export default function Home() {
  return (
    <div>
      <Toaster richColors duration={3000} />
      <CommandPalette />
      <ChattingView />
    </div>
  );
}
