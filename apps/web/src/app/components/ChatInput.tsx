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
import { AiModelMap } from '@/core/chat/ai-model';

interface ChatInputProps {
  onSubmit: (input: string) => void;
}

export const ChatInput = ({ onSubmit }: ChatInputProps) => {
  const brainGradientId = useId();

  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (!input.trim()) return;
    onSubmit(input);
    setInput('');
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
      <section className='absolute bottom-8 flex flex-col items-start gap-1'>
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          className='w-[800px] min-h-[40px] max-h-[500px]'
          placeholder='Ask AI Anything...'
        />
        <div className='flex flex-row'>
          <Select>
            <SelectTrigger className=''>
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
        <div className='flex flex-row self-end gap-2'>
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
      </section>
    </>
  );
};
