'use client';

import { Button, Kbd, KbdGroup, Textarea } from '@allin/ui';
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { filter, Subject } from 'rxjs';
import { AgentManager } from '@/business/agent/AgentManager';
import type { AgentPreset } from '@/business/agent/types';
import { useHotKey } from '@/business/hotkey/useHotKey';
import { defaultSlashCommands } from '../../slash-command/defaultCommands';
import { slashCommandManager } from '../../slash-command/SlashCommandManager';
import { SlashCommandPopover } from '../../slash-command/SlashCommandPopover';
import { ChatInputState } from './ChatInputState';

type ChatInputViewProps = {
  onSubmitText: (text: string) => Promise<void>;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
};

export const ChatInputView = ({
  onSubmitText,
  onStop,
  disabled = false,
  isStreaming = false,
}: ChatInputViewProps) => {
  const [input, _setInput] = useState('');
  const [isSlashCommandOpen, setIsSlashCommandOpen] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const modifierKeyEvent$ = useMemo(
    () => new Subject<'ArrowUp' | 'ArrowDown' | 'Enter'>(),
    [],
  );

  const subscribeToActiveAgent = useCallback((onChange: () => void) => {
    const sub = AgentManager.getInstance().activeAgentId$.subscribe(onChange);
    return () => sub.unsubscribe();
  }, []);
  const activeAgent = useSyncExternalStore<AgentPreset | null>(
    subscribeToActiveAgent,
    () => AgentManager.getInstance().activeAgent,
    () => AgentManager.getInstance().activeAgent,
  );

  const setInput = (value: string) => {
    _setInput(value);
    // sync model's state
    ChatInputState.getInstance().setValue(value);
  };

  const handleSubmit = async () => {
    if (disabled) return;

    const trimmedInput = input.trimStart();

    if (trimmedInput.startsWith('/')) {
      const withoutSlash = trimmedInput.slice(1);

      // Longest-match prefix approach for multi-word commands
      const allCommands = slashCommandManager.getCommands();
      const matchingCommands = allCommands
        .filter(cmd =>
          withoutSlash.toLowerCase().startsWith(cmd.name.toLowerCase()),
        )
        .sort((a, b) => b.name.length - a.name.length);

      const command = matchingCommands[0];
      const userText = command
        ? withoutSlash.slice(command.name.length).trimStart()
        : '';

      if (command && command.mode === 'template') {
        const resolved = slashCommandManager.resolveTemplate(command, userText);
        await onSubmitText(resolved);
        setInput('');
        return;
      }
    }

    if (!input.trim()) return;
    await onSubmitText(input.trim());
    setInput('');
  };

  const slashKey$ = useHotKey('/');
  const escapeKey$ = useHotKey('escape');

  useEffect(() => {
    slashCommandManager.registerCommands(defaultSlashCommands);
  }, []);

  useEffect(() => {
    const sub = slashKey$.pipe(filter(e => !e.isInputContext)).subscribe(e => {
      e.originalEvent.preventDefault();
      textAreaRef.current?.focus();
    });
    return () => sub.unsubscribe();
  }, [slashKey$]);

  useEffect(() => {
    if (!isStreaming || !onStop) return;
    const sub = escapeKey$.subscribe(() => {
      onStop();
    });
    return () => sub.unsubscribe();
  }, [escapeKey$, isStreaming, onStop]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const currentInput = e.target.value;
    const currentSelection = e.target.selectionStart;

    const firstPhrase = currentInput.split(/\s+/)[0];

    if (firstPhrase.startsWith('/') && currentSelection <= firstPhrase.length) {
      setIsSlashCommandOpen(true);
    } else {
      setIsSlashCommandOpen(false);
    }

    setInput(currentInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && !isSlashCommandOpen) {
      e.preventDefault();
      AgentManager.getInstance().cycleNext();
      return;
    }

    if (e.key === 'Escape') {
      setIsSlashCommandOpen(false);
    } else if (
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Enter'
    ) {
      if (isSlashCommandOpen) {
        modifierKeyEvent$.next(e.key as 'ArrowUp' | 'ArrowDown' | 'Enter');
        e.preventDefault();
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !isSlashCommandOpen) {
      e.preventDefault();
      handleSubmit().catch(err => {
        console.error('Submit failed:', err);
      });
    }
  };

  return (
    <div className='relative flex flex-col isolate z-10 w-full mx-auto'>
      <section className='w-full flex flex-col items-start'>
        <Textarea
          ref={textAreaRef}
          value={input}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          className='mx-auto max-w-2xl lg:max-w-4xl text-sm min-h-12 py-2.5 max-h-[500px] backdrop-blur-lg focus-visible:ring-ring/50 focus-visible:ring-[2px]'
          spellCheck={false}
          autoCorrect='off'
          autoCapitalize='off'
          placeholder='Ask AI Anything...'
        />
        <div className='w-full flex flex-row gap-2 max-w-2xl lg:max-w-4xl mx-auto justify-between mt-2 mb-4'>
          <div className='flex flex-row gap-2 items-center'>
            <Button
              variant='ghost'
              size='sm'
              className='text-xs text-muted-foreground gap-1'
              onClick={() => {
                AgentManager.getInstance().cycleNext();
              }}
            >
              {activeAgent ? (
                <>
                  {activeAgent.name}
                  <span className='opacity-50'>{activeAgent.model}</span>
                </>
              ) : (
                'Default'
              )}
              <KbdGroup>
                <Kbd>Tab</Kbd>
              </KbdGroup>
            </Button>
            {isStreaming && (
              <Button
                variant={'outline'}
                size='sm'
                className='pr-2'
                onClick={onStop}
              >
                Stop
              </Button>
            )}
            <Button
              variant={'outline'}
              size='sm'
              className='pr-2'
              onClick={() => {
                handleSubmit().catch(err => {
                  console.error('Submit failed:', err);
                });
              }}
              disabled={disabled || input.trim().length === 0}
            >
              Submit
              <KbdGroup>
                <Kbd>⏎</Kbd>
              </KbdGroup>
            </Button>
          </div>
        </div>
      </section>
      {isSlashCommandOpen && (
        <SlashCommandPopover
          query={input.replace(/^\/|\/$/g, '')}
          modifierKeyEvent$={modifierKeyEvent$}
          onSelect={command => {
            setIsSlashCommandOpen(false);

            if (command.mode === 'action') {
              const context = {
                currentInput: input,
                setInput,
                close: () => setIsSlashCommandOpen(false),
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
