import type { ReasoningEffort } from '@allin/ai';
import {
  Button,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RadioGroup,
} from '@allin/ui';
import { Settings2 } from 'lucide-react';
import { PromptTextArea } from './PromptTextArea';

type ModelSettingViewProps = {
  reasoningEffort: ReasoningEffort;
  onChangeSystemPrompt: (prompt: string) => void;
  onChangeReasoningEffort: (effort: ReasoningEffort) => void;
  systemPrompt: string;
};

export const ModelSettingView = ({
  reasoningEffort,
  onChangeSystemPrompt,
  onChangeReasoningEffort,
  systemPrompt,
}: ModelSettingViewProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={'outline'} size='icon' className='size-8'>
          <Settings2 />
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' alignOffset={-92} className='w-80'>
        <div className='grid gap-4'>
          <div className='flex flex-col gap-4'>
            <Label>Reasoning</Label>
            <div className='w-full px-4 pl-2'>
              <RadioGroup
                targets={['none', 'low', 'medium', 'high']}
                defaultValue={reasoningEffort}
                onChange={v => {
                  onChangeReasoningEffort(v as ReasoningEffort);
                }}
              />
            </div>
          </div>
          <PromptTextArea
            value={systemPrompt}
            changeSystemPrompt={onChangeSystemPrompt}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
