'use client';

import { Button, Kbd, KbdGroup, Textarea } from '@allin/ui';
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { filter, Subject } from 'rxjs';
import { match } from 'ts-pattern';
import { useHotKey } from '@/business/hotkey/useHotKey';
import { useService } from '@/business/ServiceContext';
import { InlineOptionSelect } from '@/components/InlineOptionSelect';
import type { TemplateCommand } from '../../slash-command/ISlashCommand';
import {
  type SlashCommandExecuteResult,
  SlashCommandPopover,
} from '../../slash-command/view/SlashCommandPopover';
import { AgentSwitchButton } from './AgentSwitchButton';
import { getTargetTemplateCommand } from './getTargetTemplateCommand';

type PendingHintSelection = {
  command: TemplateCommand;
  input: string;
};

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
  const { agentManager, slashCommandManager } = useService();
  const [input, setInput] = useState('');
  const [isSlashCommandOpen, setIsSlashCommandOpen] = useState(false);
  const [pendingHint, setPendingHint] = useState<PendingHintSelection | null>(
    null,
  );
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const modifierKeyEvent$ = useMemo(
    () => new Subject<'ArrowUp' | 'ArrowDown' | 'Enter'>(),
    [],
  );

  const handleSubmit = async () => {
    let toSendPrompt: string = input.trim();

    const templateCommand = getTargetTemplateCommand(
      input,
      slashCommandManager.getTemplateCommands(),
    );

    if (templateCommand) {
      if (templateCommand.hints && templateCommand.hints.length > 0) {
        setPendingHint({ command: templateCommand, input });
        return;
      }
      toSendPrompt = templateCommand.toPrompt(input);
    }

    setInput('');
    await onSubmitText(toSendPrompt);
  };

  const handleHintSelect = (hintValue: string) => {
    if (!pendingHint) return;
    const prompt = pendingHint.command.toPrompt(pendingHint.input, hintValue);
    setPendingHint(null);
    setInput('');
    onSubmitText(prompt).catch(err => {
      console.error('Submit failed:', err);
    });
  };

  const handleHintCancel = () => {
    setPendingHint(null);
    textAreaRef.current?.focus();
  };

  const slashKey$ = useHotKey('/');
  const escapeKey$ = useHotKey('escape');

  useEffect(() => {
    const sub = slashKey$.pipe(filter(e => !e.isInputElement)).subscribe(e => {
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
      agentManager.cycleSelectedAgent();
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
        {pendingHint ? (
          <InlineOptionSelect
            options={pendingHint.command.hints!.map(hint => ({
              label: hint,
              value: hint,
            }))}
            onSelect={handleHintSelect}
            onCancel={handleHintCancel}
            header={`Select option for /${pendingHint.command.commandName}`}
            className='mx-auto max-w-2xl lg:max-w-4xl w-full border rounded-md py-2'
          />
        ) : (
          <>
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
                <AgentSwitchButton />
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
              </div>
              <Button
                variant='ghost'
                size='xs'
                className='pr-2 gap-1'
                onClick={() => {
                  handleSubmit().catch(err => {
                    console.error('Submit failed:', err);
                  });
                }}
                disabled={disabled || input.trim().length === 0}
              >
                Submit
                <KbdGroup>
                  <Kbd className='text-xs'>⏎</Kbd>
                </KbdGroup>
              </Button>
            </div>
          </>
        )}
      </section>
      {!pendingHint && isSlashCommandOpen && (
        <SlashCommandPopover
          // Strip leading/trailing slashes so "/translate" becomes "translate" for fuzzy search
          query={input.replace(/^\/|\/$/g, '')}
          modifierKeyEvent$={modifierKeyEvent$}
          onExecute={result => {
            setIsSlashCommandOpen(false);
            match(result)
              .with({ type: 'action' }, () => {
                setInput('');
              })
              .with({ type: 'template' }, ({ inputValue }) => {
                setInput(inputValue);
                textAreaRef.current?.focus();
              })
              .exhaustive();
          }}
          anchorRef={textAreaRef}
        />
      )}
    </div>
  );
};
