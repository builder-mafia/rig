'use client';

import { Button, Kbd, KbdGroup, Textarea } from '@allin/ui';
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Subject } from 'rxjs';
import type { Session } from '../session/Session';
import { defaultSlashCommands } from '../slash-command/defaultCommands';
import { slashCommandManager } from '../slash-command/SlashCommandManager';
import { SlashCommandPopover } from '../slash-command/SlashCommandPopover';
import { ChatInputState } from './ChatInputState';

type ChatInputViewProps = {
  session: Session | null;
};

export const ChatInputView = ({ session }: ChatInputViewProps) => {
  const [input, _setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const modifierKeyEvent$ = useMemo(
    () => new Subject<'ArrowUp' | 'ArrowDown' | 'Enter'>(),
    [],
  );

  const setInput = (value: string) => {
    _setInput(value);
    // sync model's state
    ChatInputState.getInstance().setValue(value);
  };

  const handleSubmit = () => {
    if (!input.trim() || !session) return;
    // TODO: send message via session
    setInput('');
  };

  useEffect(() => {
    slashCommandManager.registerCommands(defaultSlashCommands);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const currentInput = e.target.value;
    const currentSelection = e.target.selectionStart;

    const firstPhrase = currentInput.split(/\s+/)[0];

    if (firstPhrase.startsWith('/') && currentSelection <= firstPhrase.length) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }

    setInput(currentInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Enter'
    ) {
      if (isOpen) {
        modifierKeyEvent$.next(e.key as 'ArrowUp' | 'ArrowDown' | 'Enter');
        e.preventDefault();
      }
    }
  };

  return (
    <div className='relative flex flex-col isolate z-10 w-full mx-auto'>
      <section className='w-full flex flex-col items-start'>
        <Textarea
          ref={textAreaRef}
          value={input}
          onKeyDown={handleKeyDown}
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
      {isOpen && (
        <SlashCommandPopover
          query={input.replace(/^\/|\/$/g, '')}
          modifierKeyEvent$={modifierKeyEvent$}
          onSelect={command => {
            setIsOpen(false);

            if (command.mode === 'action') {
              const context = {
                currentInput: input,
                setInput,
                close: () => setIsOpen(false),
              };
              setInput('');
              Promise.resolve(command.execute(context)).catch(err => {
                console.error('Action execute error:', err);
              });
            } else if (command.mode === 'template') {
              setInput('/' + command.name + ' ');
              textAreaRef.current?.focus();
            }
          }}
          anchorRef={textAreaRef}
        />
      )}
    </div>
  );
};
