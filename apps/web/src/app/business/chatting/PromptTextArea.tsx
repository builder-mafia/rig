import { Label, Textarea } from '@allin/ui';
import { useRef } from 'react';

type PromptTextAreaProps = {
  value: string;
  changeSystemPrompt: (prompt: string) => void;
};

export const PromptTextArea = ({
  value,
  changeSystemPrompt,
}: PromptTextAreaProps) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleBlur = () => {
    const newValue = ref.current?.value;
    if (newValue && newValue !== value) {
      changeSystemPrompt(newValue);
    }
  };

  return (
    <div className='flex flex-col gap-4'>
      <Label htmlFor='prompt'>Prompt</Label>
      <Textarea
        ref={ref}
        id='prompt'
        placeholder='Enter your prompt here...'
        className='w-full h-full rounded-sm !text-sm max-h-72 p-2 min-h-32'
        defaultValue={value}
        onBlur={handleBlur}
      />
    </div>
  );
};
