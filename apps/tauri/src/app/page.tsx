'use client';

import { Toaster } from '@allin/ui';
import { ChattingView } from '@/business/chatting/ChattingView';
import { CommandPalette } from '@/business/command-palette/CommandPaletteView';
import { Initializer } from '@/business/Initializer';
import { ServiceProvider } from '@/business/ServiceContext';
import { QueryProvider } from '@/lib/QueryProvider';

export default function Home() {
  return (
    <ServiceProvider>
      <QueryProvider>
        <Toaster richColors duration={3000} theme='light' />
        <CommandPalette />
        <ChattingView />
        <Initializer />
      </QueryProvider>
    </ServiceProvider>
  );
}
