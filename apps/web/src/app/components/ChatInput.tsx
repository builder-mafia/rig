import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSubmit: (input: string) => void;
}

export const ChatInput = ({ onSubmit }: ChatInputProps) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (!input.trim()) return;
    onSubmit(input);
    setInput('');
  };

  return (
    <section className='absolute bottom-8 flex flex-col items-start gap-2'>
      <Textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        className='w-[800px] min-h-[40px] max-h-[500px]'
        placeholder='Ask AI Anything...'
      />
      <div className='flex flex-row'>
        <Button
          variant={'outline'}
          size='xs'
          className='py-2 px-1 gap-1 text-xs'
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
          className='py-2 px-1 gap-1 text-xs'
        >
          Actions
          <KbdGroup>
            <Kbd>⌘K</Kbd>
          </KbdGroup>
        </Button>
      </div>
    </section>
  );
};
