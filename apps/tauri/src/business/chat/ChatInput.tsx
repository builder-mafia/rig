'use client';

import { Button, Kbd, KbdGroup, Textarea } from '@allin/ui';
import type { Session } from '../session/Session';

type ChatInputProps = {
  session: Session;
};

export const ChatInput = ({ session }: ChatInputProps) => {
  return (
    <div className='relative flex flex-col isolate z-10 w-full mx-auto'>
      <section className='w-full flex flex-col items-start'>
        <Textarea
          className='mx-auto max-w-2xl lg:max-w-4xl min-h-12 py-2.5 max-h-[500px] backdrop-blur-lg'
          placeholder='Ask AI Anything...'
        />
        <div className='w-full flex flex-row gap-2 max-w-2xl lg:max-w-4xl mx-auto justify-between mt-2 mb-4'>
          <div className='flex flex-row gap-2'>
            {'dd' === 'streaming' ? (
              <Button variant={'outline'} size='sm' className='pr-2'>
                Stop
                <KbdGroup>
                  <Kbd>⌘⏎</Kbd>
                </KbdGroup>
              </Button>
            ) : (
              <Button
                variant={'outline'}
                size='sm'
                className='pr-2'
                // ?onClick={handleSubmit}
                // disabled={input.trim().length === 0}
              >
                Submit
                <KbdGroup>
                  <Kbd>⌘⏎</Kbd>
                </KbdGroup>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
