import { useCallback, useEffect, useRef, useState } from 'react';
import type { StorageChannel } from '@/lib/gateway/channel/types';
import { useChannel } from '../channel/useChannel';

type ChannelTitleViewProps = {
  channel: StorageChannel;
};

export const ChannelTitleView = ({ channel }: ChannelTitleViewProps) => {
  const { updateChannelTitle } = useChannel();
  const [value, setValue] = useState(channel.title ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(channel.title ?? '');
  }, [channel]);

  const save = useCallback(async () => {
    const trimmed = value.trim();
    const newTitle = trimmed || null;

    if (newTitle === channel.title) return;
    await updateChannelTitle(channel.id, trimmed);
  }, [value, channel.id, channel.title, updateChannelTitle]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        inputRef.current?.blur();
      }
      if (e.key === 'Escape') {
        setValue(channel.title ?? '');
        inputRef.current?.blur();
      }
    },
    [channel.title],
  );

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={handleKeyDown}
      className='w-full max-w-[320px] truncate rounded-md text-sm font-medium text-foreground/80 hover:bg-muted/90 focus:bg-muted/90 focus:ring-1 focus:ring-ring/30 outline-none px-2 py-1 transition-colors'
      placeholder='Untitled'
    />
  );
};
