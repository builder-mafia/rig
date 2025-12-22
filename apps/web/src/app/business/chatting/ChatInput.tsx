import {
  type AllModelIds,
  AllModelIdsSchema,
  ChatFacadeManager,
  generateUIMessage,
  type LLMProviderName,
  LLMProviderNameSchema,
  type ReasoningEffort,
} from '@allin/chat';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import { Button, ButtonGroup, Kbd, KbdGroup, Textarea } from '@allin/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { UIMessage } from 'ai';
import { useSetAtom } from 'jotai';
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { filter } from 'rxjs';
import { useSwrAtomValue } from '@/hooks/use-swr-atom-value';
import { dbAtoms } from '@/idb/db-store';
import { assert } from '@/utils/assert';
import { waitUntil } from '@/utils/wait-until';
import { HotKeyList } from '../hotkey/hotkey-list';
import { ModelSelectView } from './ModelSelectView';
import { ModelSettingView } from './ModelSettingView';

export const ChatInput = () => {
  const selectedChannel = useSwrAtomValue(dbAtoms.selectedChannelAtom);
  const config = useSwrAtomValue(dbAtoms.configAtom);

  assert(selectedChannel, 'ChatInput: selectedChannel is not found.');
  assert(config, 'ChatInput: config is not found.');

  // chat facade is created asynchronously after the channel is selected. (see useChat.ts)
  // so we need to wait until the chat facade is created.
  const { data: chatFacade } = useSuspenseQuery({
    queryKey: ['chatInput', selectedChannel.id],
    queryFn: async () => {
      await waitUntil(
        ChatFacadeManager.getInstance()
          .getChatFacadeCreated$()
          .pipe(filter(id => id === selectedChannel.id)),
        // if the chat facade is not created within 10 seconds, throw an error.
        // most of the time, the chat facade is created within 100ms.
        // (because data fetching from IndexedDB is so fast.)
        10 * 1000,
      );

      return ChatFacadeManager.getInstance().getChatFacade(selectedChannel.id);
    },
  });

  const updateChannel = useSetAtom(dbAtoms.updateChannelAtom);
  // In Composing Language (Korean, Japanese, Chinese, etc...),
  // after setInput('') is called, the input is updated. (that's related to IME.)
  // so we need to ignore the next change by adding a flag.
  const ignoreNextChangeRef = useRef(false);
  const [input, setInput] = useState('');
  const [providerAndModel, setProviderAndModel] = useState<{
    providerName: LLMProviderName;
    modelId: AllModelIds;
  }>({
    providerName: selectedChannel.providerName,
    modelId: selectedChannel.model,
  });

  const subscribeToStatus = useCallback(
    (onChange: () => void) => {
      const subscription = chatFacade.getStatus$().subscribe(onChange);
      return () => {
        subscription.unsubscribe();
      };
    },
    [chatFacade],
  );

  const status = useSyncExternalStore(
    subscribeToStatus,
    () => chatFacade.getStatus(),
    () => chatFacade.getStatus(),
  );

  const sendMessage = (
    message: UIMessage<UIMessageMetadata> & { role: 'user' },
  ) => {
    chatFacade.sendMessage(message);
  };

  const stop = () => {
    if (status !== 'streaming') {
      return;
    }

    chatFacade.stop();
  };

  const textAreaRef = useHotkeys<HTMLTextAreaElement>(
    HotKeyList.submitChat.hotkey,
    event => {
      if (status === 'streaming') {
        stop();
        return;
      }

      if (event.isComposing) {
        ignoreNextChangeRef.current = true;
      }

      if (!input.trim()) {
        ignoreNextChangeRef.current = false;
        return;
      }

      sendMessage(generateUIMessage('user', input));
      setInput('');
    },
    {
      // https://react-hotkeys-hook.vercel.app/docs/api/use-hotkeys#enableonformtags
      // useHotkeys doesn't work with form tags by default. (textarea, input, etc...)
      // so need to explicitly enable it.
      enableOnFormTags: ['textarea', 'TEXTAREA'],
    },
  );

  useHotkeys(HotKeyList.focusChatInput.hotkey, e => {
    if (textAreaRef.current) {
      // "/" key trigger focus on the text area.
      // add e.preventDefault() to prevent "/" from being inputted.
      e.preventDefault();
      textAreaRef.current.focus();
    }
  });

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (ignoreNextChangeRef.current) {
      ignoreNextChangeRef.current = false;
      return;
    }
    setInput(e.target.value);
  };

  const handleSubmit = () => {
    if (!input.trim()) return;

    sendMessage(generateUIMessage('user', input));
    setInput('');
  };

  const handleStop = async () => {
    if (status !== 'streaming') {
      return;
    }

    await stop();
  };

  const enabledProviders = useMemo(() => {
    const providerNames = Object.keys(config.apiKeys) as LLMProviderName[];

    return providerNames.filter(providerName =>
      Boolean(config.apiKeys[providerName]),
    );
  }, [config]);

  const onChange = (modelWithProvider: string) => {
    const [providerName, modelId] = modelWithProvider.split('|');

    const safeProviderName = LLMProviderNameSchema.parse(providerName);
    const safeModelId = AllModelIdsSchema.parse(modelId);

    if (!enabledProviders.includes(safeProviderName)) {
      // this error must not be thrown.
      // because SelectItem is disabled when provider is not available.
      throw new Error(
        `Chatinput.tsx Provider ${safeProviderName} is not available.`,
      );
    }

    setProviderAndModel({
      providerName: safeProviderName,
      modelId: safeModelId,
    });
    onChangeSelectedModel(safeModelId, safeProviderName);
  };

  useEffect(() => {
    setProviderAndModel({
      providerName: selectedChannel.providerName,
      modelId: selectedChannel.model,
    });
  }, [selectedChannel.model, selectedChannel.providerName]);

  const onChangeSelectedModel = (
    modelId: AllModelIds,
    providerName: LLMProviderName,
  ) => {
    updateChannel(selectedChannel.id, { model: modelId, providerName });
  };

  const onChangeSystemPrompt = (prompt: string) => {
    updateChannel(selectedChannel.id, { prompt: prompt });
  };

  const onChangeReasoningEffort = (effort: ReasoningEffort) => {
    updateChannel(selectedChannel.id, { reasoningEffort: effort });
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
          <ButtonGroup className='flex flex-row h-8'>
            <ModelSelectView
              selectedModelId={providerAndModel.modelId}
              selectedProvider={providerAndModel.providerName}
              onChange={onChange}
              enabledProviders={enabledProviders}
            />
            <ModelSettingView
              reasoningEffort={selectedChannel.reasoningEffort}
              systemPrompt={selectedChannel.prompt ?? ''}
              onChangeSystemPrompt={onChangeSystemPrompt}
              onChangeReasoningEffort={onChangeReasoningEffort}
            />
          </ButtonGroup>
          <div className='flex flex-row gap-2'>
            {status === 'streaming' ? (
              <Button
                variant={'outline'}
                size='sm'
                className='pr-2'
                onClick={handleStop}
              >
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
                onClick={handleSubmit}
                disabled={input.trim().length === 0}
              >
                Submit
                <KbdGroup>
                  <Kbd>⌘⏎</Kbd>
                </KbdGroup>
              </Button>
            )}
            {/* <Button
              variant={'outline'}
              size='xs'
              className='py-2 px-1 pr-0 text-xs gap-1'
            >
              Actions
              <KbdGroup>
                <Kbd>⌘K</Kbd>
              </KbdGroup>
            </Button> */}
          </div>
        </div>
      </section>
    </div>
  );
};
