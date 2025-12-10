import type { UIMessage } from 'ai';
import { useSetAtom } from 'jotai';
import { type ChangeEvent, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Kbd, KbdGroup } from '@/components/ui/kbd';

import { Textarea } from '@/components/ui/textarea';
import { ChatFacadeManager } from '@/core/chat/ChatFacadeManager';
import { generateUIMessage } from '@/core/chat/message-util';
import {
  type AllModelIds,
  AllModelIdsSchema,
  type LLMProviderName,
  LLMProviderNameSchema,
} from '@/core/provider/all-models';
import { useSwrAtomValue } from '@/hooks/use-swr-atom-value';
import { dbAtoms } from '@/idb/db-store';
import { assert } from '@/utils/assert';
import { isProviderEnabled } from '../helper/is-provider-enabled';
import { HotKeyList } from '../hotkey/hotkey-list';
import { ModelSelectView } from './ModelSelectView';

export const ChatInput = () => {
  const selectedChannel = useSwrAtomValue(dbAtoms.selectedChannelAtom);
  const config = useSwrAtomValue(dbAtoms.configAtom);
  assert(selectedChannel, 'ChatInput: selectedChannel is not found.');
  assert(config, 'ChatInput: config is not found.');

  const updateChannel = useSetAtom(dbAtoms.updateChannelAtom);
  const ignoreNextChangeRef = useRef(false);

  const [input, setInput] = useState('');
  const [LLM, setLLM] = useState<{
    providerName: LLMProviderName;
    modelId: AllModelIds;
  }>({
    providerName: selectedChannel.providerName,
    modelId: selectedChannel.model,
  });

  const sendMessage = (message: UIMessage & { role: 'user' }) => {
    if (!ChatFacadeManager.getInstance().hasChatFacade(selectedChannel.id)) {
      toast.error('Failed to send message.');
      console.error('ChatFacade is not found.');
      return;
    }

    ChatFacadeManager.getInstance()
      .getChatFacade(selectedChannel.id)
      .sendMessage(message);
  };

  const textAreaRef = useHotkeys<HTMLTextAreaElement>(
    HotKeyList.submitChat.hotkey,
    event => {
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
      // after focus, the `/` key is inputted.
      // so need to prevent `/` from being inputted.
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
          onChange={handleChange}
          className='mx-auto max-w-2xl lg:max-w-4xl min-h-[40px] max-h-[500px] backdrop-blur-lg'
          placeholder='Ask AI Anything...'
        />
        <div className='w-full flex flex-row gap-2 max-w-2xl lg:max-w-4xl mx-auto justify-between mt-1.5 mb-2'>
          <div className='flex flex-row'>
            <ModelSelectView
              modelId={LLM.modelId}
              providerName={LLM.providerName}
              onChange={onChange}
              config={config}
            />
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
