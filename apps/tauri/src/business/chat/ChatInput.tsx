'use client';

import { Button, Kbd, KbdGroup, Textarea } from '@allin/ui';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import type { Session } from '../session/Session';
import { defaultSlashCommands } from '../slash-command/defaultCommands';
import { slashCommandManager } from '../slash-command/SlashCommandManager';
import { SlashCommandPopover } from '../slash-command/SlashCommandPopover';

type ChatInputProps = {
  session: Session | null;
};

export const ChatInput = ({ session }: ChatInputProps) => {
  const [input, setInput] = useState('');
  const [isSlashOpen, setIsSlashOpen] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    slashCommandManager.registerCommands(defaultSlashCommands);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInput(newValue);

    if (newValue === '/' && !isSlashOpen) {
      setIsSlashOpen(true);
    }
  };

  const handleSubmit = () => {
    if (!input.trim() || !session) return;
    // TODO: send message via session
    setInput('');
  };

  return (
    <div className='relative flex flex-col isolate z-10 w-full mx-auto'>
      <section className='w-full flex flex-col items-start'>
        <Textarea
          ref={textAreaRef}
          value={input}
          onChange={handleChange}
          className='mx-auto max-w-2xl lg:max-w-4xl min-h-12 py-2.5 max-h-[500px] backdrop-blur-lg'
          placeholder='Ask AI Anything...'
        />
        <div className='w-full flex flex-row gap-2 max-w-2xl lg:max-w-4xl mx-auto justify-between mt-2 mb-4'>
          <div className='flex flex-row gap-2'>
            <Button
              variant={'outline'}
              size='sm'
              className='pr-2'
              onClick={handleSubmit}
              disabled={input.trim().length === 0}
            >
              Submit
              <KbdGroup>
                <Kbd>⌘⏎</Kbd>
              </KbdGroup>
            </Button>
          </div>
        </div>
      </section>
      <SlashCommandPopover
        isOpen={isSlashOpen}
        onClose={() => setIsSlashOpen(false)}
        currentInput={input}
        setInput={setInput}
        anchorRef={textAreaRef}
      />
    </div>
  );
};
