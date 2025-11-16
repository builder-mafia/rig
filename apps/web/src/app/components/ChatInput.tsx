import { Brain } from 'lucide-react';
import { useId, useState } from 'react';
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
import {
  AiModelMap,
  assertModel,
  getProviderFromModel,
  type LLMModel,
  type LLMModelMap,
  type LLMProvider,
} from '@/core/chat/ai-model';
import { useChannelMutation } from '@/idb/useChanelMutation';

interface ChatInputProps {
  onSubmit: (input: string) => void;
  onChangeSelectedModel: (model: LLMModel) => void;
}

export const ChatInput = ({
  onSubmit,
  onChangeSelectedModel,
}: ChatInputProps) => {
  const brainGradientId = useId();

  const [input, setInput] = useState('');
  const [LLM, setLLM] = useState<{
    provider: LLMProvider;
    model: LLMModelMap[keyof LLMModelMap];
  } | null>(null);

  const handleSubmit = () => {
    if (!input.trim()) return;
    onSubmit(input);
    setInput('');
  };

  const onChange = (model: string) => {
    assertModel(model);

    const provider = getProviderFromModel(model);
    setLLM({ provider, model });
    onChangeSelectedModel(model);
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
            id={brainGradientId}
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
      <section className='absolute bottom-4 flex flex-col items-start gap-1.5'>
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          className='w-[800px] min-h-[40px] max-h-[500px]'
          placeholder='Ask AI Anything...'
        />
        <div className='flex flex-row gap-2 justify-between w-full'>
          <div className='flex flex-row'>
            <Select onValueChange={onChange}>
              <SelectTrigger
                data-size='fit'
                data-provider={LLM?.provider}
                className='border-none bg-transparent dark:bg-transparent hover:bg-transparent focus:bg-transparent h-fit p-1 text-xs
                data-[provider=openai]:bg-gradient-to-r data-[provider=openai]:from-[#74AA9C] data-[provider=openai]:via-[#20d4c7] data-[provider=openai]:to-[#0f9775] data-[provider=openai]:bg-clip-text data-[provider=openai]:text-transparent
                data-[provider=google]:bg-gradient-to-r data-[provider=google]:from-[#4796E3] data-[provider=google]:via-[#9177C7] data-[provider=google]:to-[#CA6673] data-[provider=google]:bg-clip-text data-[provider=google]:text-transparent
                '
              >
                <SelectValue placeholder='Select a model' />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AiModelMap).map(([provider, models]) => (
                  <SelectGroup key={provider}>
                    <SelectLabel>{provider}</SelectLabel>
                    {models.map(model => (
                      <SelectItem
                        className='gap-1.5'
                        key={model.name}
                        value={model.name}
                        trailing={
                          model.thinking ? (
                            <span className='text-muted-foreground'>
                              <Brain
                                className='size-4 stroke-1'
                                stroke={`url(#${brainGradientId})`}
                              />
                            </span>
                          ) : undefined
                        }
                      >
                        {model.display}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-row gap-2'>
            <Button
              variant={'outline'}
              size='xs'
              className='py-2 px-1 pr-0 text-xs gap-1'
              onClick={handleSubmit}
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
      </section>
    </>
  );
};
