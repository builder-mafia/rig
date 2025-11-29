import type { UIMessage } from 'ai';
import { useSetAtom } from 'jotai';
import { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
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
import { generateUIMessage } from '@/core/helper';
import {
  type AllModelIds,
  AllModelIdsSchema,
  type LLMProviderName,
  LLMProviderNameSchema,
  MODEL_IDS_PER_PROVIDER,
} from '@/core/provider/all-models';
import { dbAtoms } from '@/idb/dbStore';
import { assertDefined } from '@/utils/assertDefined';
import { useSwrAtomValue } from '@/utils/useSwrAtomValue';
import { canUseProvider } from '../helper/check';
import { HotKeyList } from '../hotkey/hotkey-list';

export const ChatInput = ({
  sendMessage,
}: {
  sendMessage: (message: UIMessage) => void;
}) => {
  const selectedChannel = useSwrAtomValue(dbAtoms.selectedChannelAtom);
  const config = useSwrAtomValue(dbAtoms.configAtom);
  assertDefined(selectedChannel, 'ChatInput: selectedChannel is not found.');
  assertDefined(config, 'ChatInput: config is not found.');

  const setSelectedChannel = useSetAtom(dbAtoms.selectedChannelAtom);
  const [input, setInput] = useState('');
  const [LLM, setLLM] = useState<{
    providerName: LLMProviderName;
    modelId: AllModelIds;
  }>({
    providerName: selectedChannel.providerName,
    modelId: selectedChannel.model,
  });

  const hotkeyScopeRef = useHotkeys<HTMLTextAreaElement>(
    HotKeyList.submitChat.hotkey,
    () => {
      if (!input.trim()) return;
      onSubmit(input);
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
    if (hotkeyScopeRef.current) {
      // after focus, the `/` key is inputted.
      // so need to prevent `/` from being inputted.
      e.preventDefault();
      hotkeyScopeRef.current.focus();
    }
  });

  const handleSubmit = () => {
    if (!input.trim()) return;
    onSubmit(input);
    setInput('');
  };

  const onChange = (modelWithProvider: string) => {
    const [providerName, modelId] = modelWithProvider.split('|');

    const parsedProviderName = LLMProviderNameSchema.parse(providerName);
    const parsedModelId = AllModelIdsSchema.parse(modelId);

    if (!canUseProvider(parsedProviderName, config)) {
      // this error must not be thrown.
      // because SelectItem is disabled when provider is not available.
      throw new Error(
        `Chatinput.tsx Provider ${parsedProviderName} is not available.`,
      );
    }

    setLLM({ providerName: parsedProviderName, modelId: parsedModelId });
    onChangeSelectedModel(parsedModelId, parsedProviderName);
  };

  const onSubmit = (input: string) => {
    sendMessage(generateUIMessage('user', input));
  };

  const onChangeSelectedModel = (
    modelId: AllModelIds,
    providerName: LLMProviderName,
  ) => {
    setSelectedChannel({ model: modelId, providerName });
  };

  return (
    <>
      <svg
        aria-hidden='true'
        className='absolute h-0 w-0'
        xmlns='http://www.w3.org/2000/svg'
      >
        <defs>
          <linearGradient
            id={'thinking-gradient'}
            x1='0%'
            y1='0%'
            x2='100%'
            y2='100%'
          >
            <stop offset='0%' stopColor='#38bdf8' />
            <stop offset='100%' stopColor='#2563eb' />
          </linearGradient>
        </defs>
      </svg>
      <section className='fixed bottom-0 w-full flex flex-col items-start'>
        <Textarea
          ref={hotkeyScopeRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          className='mx-auto max-w-2xl lg:max-w-4xl min-h-[40px] max-h-[500px] backdrop-blur-lg'
          placeholder='Ask AI Anything...'
        />
        <div className='w-full bg-background pb-2 pt-1.5'>
          <div className='flex flex-row gap-2 max-w-2xl lg:max-w-4xl mx-auto justify-between'>
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
                            !canUseProvider(
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
                              !canUseProvider(
                                providerName as LLMProviderName,
                                config,
                              )
                            }
                            className='gap-1.5'
                            key={`${providerName}|${modelId}`}
                            value={`${providerName}|${modelId}`}
                            // trailing={
                            //   modelId.thinking ? (
                            //     <span className='text-muted-foreground'>
                            //       <Brain
                            //         className='size-4 stroke-1'
                            //         stroke={`url(#thinking-gradient)`}
                            //       />
                            //     </span>
                            //   ) : undefined
                            // }
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
              <Button
                variant={'outline'}
                size='xs'
                className='py-2 px-1 pr-0 text-xs gap-1'
              >
                Actions
                <KbdGroup>
                  <Kbd>⌘K</Kbd>
                </KbdGroup>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
