'use client';

import { Toaster } from '@allin/ui';
import { CommandSetting } from '@/business/settings/CommandSetting';

export default function Home() {
  return (
    <div>
      <Toaster richColors duration={3000} />
      <CommandSetting />
    </div>
  );
}
