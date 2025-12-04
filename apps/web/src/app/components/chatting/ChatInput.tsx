import type { UIMessage } from 'ai';
import { useSetAtom } from 'jotai';
import { useCallback, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChatFacadeManager } from '@/core/chat/ChatFacadeManager';
import { generateUIMessage } from '@/core/helper';
import {
  type AllModelIds,
  AllModelIdsSchema,
  type LLMProviderName,
  LLMProviderNameSchema,
  MODEL_IDS_PER_PROVIDER,
} from '@/core/provider/all-models';
import { useSwrAtomValue } from '@/hooks/use-swr-atom-value';
import { dbAtoms } from '@/idb/db-store';
import { assert } from '@/utils/assert';
import { isProviderEnabled } from '../helper/is-provider-enabled';
import { HotKeyList } from '../hotkey/hotkey-list';

export const ChatInput = () => {
  const selectedChannel = useSwrAtomValue(dbAtoms.selectedChannelAtom);
  const config = useSwrAtomValue(dbAtoms.configAtom);
  assert(selectedChannel, 'ChatInput: selectedChannel is not found.');
  assert(config, 'ChatInput: config is not found.');

  const updateChannel = useSetAtom(dbAtoms.updateChannelAtom);

  const [input, setInput] = useState('');
  const [LLM, setLLM] = useState<{
    providerName: LLMProviderName;
    modelId: AllModelIds;
  }>({
    providerName: selectedChannel.providerName,
    modelId: selectedChannel.model,
  });

  const sendMessage = (message: UIMessage & { role: 'user' }) => {
    const currentChatFacade = ChatFacadeManager.getChatFacade(
      selectedChannel.id,
    );

    if (!currentChatFacade) {
      toast.error('Failed to send message.');
      console.error('ChatFacade is not found.');
      return;
    }

    currentChatFacade.sendMessage(message);
  };

  const textAreaRef = useHotkeys<HTMLTextAreaElement>(
    HotKeyList.submitChat.hotkey,
    () => {
      if (!input.trim()) return;
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
      // after focus, the `/` key is inputted.
      // so need to prevent `/` from being inputted.
      e.preventDefault();
      textAreaRef.current.focus();
    }
  });

  const handleSubmit = () => {
    if (!input.trim()) return;
    sendMessage(generateUIMessage('user', input));
    setInput('');
  };

  const onChange = (modelWithProvider: string) => {
    const [providerName, modelId] = modelWithProvider.split('|');

    const parsedProviderName = LLMProviderNameSchema.parse(providerName);
    const parsedModelId = AllModelIdsSchema.parse(modelId);

    if (!isProviderEnabled(parsedProviderName, config)) {
      // this error must not be thrown.
      // because SelectItem is disabled when provider is not available.
      throw new Error(
        `Chatinput.tsx Provider ${parsedProviderName} is not available.`,
      );
    }

    setLLM({ providerName: parsedProviderName, modelId: parsedModelId });
    onChangeSelectedModel(parsedModelId, parsedProviderName);
  };

  const onChangeSelectedModel = (
    modelId: AllModelIds,
    providerName: LLMProviderName,
  ) => {
    updateChannel(selectedChannel.id, { model: modelId, providerName });
  };

  return (
    <div className='relative flex flex-col isolate z-10 w-full mx-auto'>
      <section className='w-full flex flex-col items-start'>
        <Textarea
          ref={textAreaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          className='mx-auto max-w-2xl lg:max-w-4xl min-h-[40px] max-h-[500px] backdrop-blur-lg'
          placeholder='Ask AI Anything...'
        />
        <div className='w-full flex flex-row gap-2 max-w-2xl lg:max-w-4xl mx-auto justify-between mt-1.5 mb-2'>
          <div className='flex flex-row'>
            <Select
              value={`${LLM.providerName}|${LLM.modelId}`}
              onValueChange={onChange}
            >
              <SelectTrigger
                data-size='fit'
                data-provider={LLM.providerName}
                className='border-none bg-transparent dark:bg-transparent hover:bg-transparent focus:bg-transparent h-fit p-1 text-xs
                data-[provider=openai]:bg-gradient-to-r data-[provider=openai]:from-[#74AA9C] data-[provider=openai]:via-[#20d4c7] data-[provider=openai]:to-[#0f9775] data-[provider=openai]:bg-clip-text data-[provider=openai]:text-transparent
                data-[provider=google]:bg-gradient-to-r data-[provider=google]:from-[#4796E3] data-[provider=google]:via-[#9177C7] data-[provider=google]:to-[#CA6673] data-[provider=google]:bg-clip-text data-[provider=google]:text-transparent
                '
              >
                <SelectValue placeholder='Select a model' />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MODEL_IDS_PER_PROVIDER).map(
                  ([providerName, modelIds]) => (
                    <SelectGroup key={providerName}>
                      <SelectLabel
                        aria-disabled={
                          !isProviderEnabled(
                            providerName as LLMProviderName,
                            config,
                          )
                        }
                      >
                        {providerName}
                      </SelectLabel>
                      {modelIds.map(modelId => (
                        <SelectItem
                          disabled={
                            !isProviderEnabled(
                              providerName as LLMProviderName,
                              config,
                            )
                          }
                          className='gap-1.5'
                          key={`${providerName}|${modelId}`}
                          value={`${providerName}|${modelId}`}
                        >
                          {modelId}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-row gap-2'>
            <Button
              variant={'outline'}
              size='xs'
              className='py-2 px-1 pr-0 text-xs gap-1'
              onClick={handleSubmit}
              disabled={input.trim().length === 0}
            >
              Submit
              <KbdGroup>
                <Kbd>⌘⏎</Kbd>
              </KbdGroup>
            </Button>
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
