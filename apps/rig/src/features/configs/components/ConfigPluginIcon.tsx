import Image from 'next/image';
import OpenAI from '@lobehub/icons/es/OpenAI/components/Mono';
import { Globe2, SlidersHorizontal } from 'lucide-react';
import type { ConfigPlugin } from '../types';

const bundledIcons = new Map([
  ['vercel', '/application_icon/vercel-dashboard.svg'],
  ['terminal', '/application_icon/terminal-dashboard.webp'],
  ['claude-code', '/application_icon/clawd.webp'],
  ['starship', '/application_icon/starship-dashboard.svg'],
  ['gemini-cli', '/application_icon/gemini-cli-dashboard.png'],
]);

export const ConfigPluginIcon = ({
  plugin,
  size = 24,
}: {
  plugin: Pick<ConfigPlugin, 'id' | 'icon' | 'builtin'>;
  size?: number;
}) => {
  const { icon } = plugin;
  const useVercel = plugin.builtin && plugin.id === 'agent-browser';
  const image =
    bundledIcons.get(useVercel ? 'vercel' : icon) ??
    (icon.startsWith('data:image/png;base64,') ? icon : null);

  return (
    <span
      aria-hidden
      className='inline-flex shrink-0 items-center justify-center rounded-lg bg-muted/70 p-2 text-foreground'
    >
      {image ? (
        <Image
          src={image}
          alt=''
          width={size}
          height={size}
          unoptimized
          className={
            useVercel ? 'object-contain dark:invert' : 'object-contain'
          }
        />
      ) : icon === 'codex' ? (
        <OpenAI size={size} />
      ) : icon === 'browser' ? (
        <Globe2 size={size} className='text-sky-600 dark:text-sky-400' />
      ) : (
        <SlidersHorizontal size={size} />
      )}
    </span>
  );
};
