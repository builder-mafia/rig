import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type AllModelIds,
  type LLMProviderName,
  MODEL_IDS_PER_PROVIDER,
} from '@/core/provider/all-models';
import type { ConfigType } from '@/idb/db';
import { isProviderEnabled } from '../helper/is-provider-enabled';

type ModelSelectViewProps = {
  modelId: AllModelIds;
  providerName: LLMProviderName;
  onChange: (modelIdWithProvider: string) => void;
  config: ConfigType;
};

export const ModelSelectView = ({
  modelId,
  providerName,
  onChange,
  config,
}: ModelSelectViewProps) => {
  return (
    <Select value={`${providerName}|${modelId}`} onValueChange={onChange}>
      <SelectTrigger
        data-size='fit'
        data-provider={providerName}
        className='border-none bg-transparent dark:bg-transparent hover:bg-transparent focus:bg-transparent h-fit p-1 text-xs
                data-[provider=openai]:bg-gradient-to-r data-[provider=openai]:from-[#74AA9C] data-[provider=openai]:via-[#20d4c7] data-[provider=openai]:to-[#0f9775] data-[provider=openai]:bg-clip-text data-[provider=openai]:text-transparent
                data-[provider=google]:bg-gradient-to-r data-[provider=google]:from-[#4796E3] data-[provider=google]:via-[#9177C7] data-[provider=google]:to-[#CA6673] data-[provider=google]:bg-clip-text data-[provider=google]:text-transparent
                '
      >
        <SelectValue placeholder='Select a model' />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(MODEL_IDS_PER_PROVIDER)
          // show only valid models that are configured
          .filter(([providerName]) =>
            isProviderEnabled(providerName as LLMProviderName, config),
          )
          .map(([providerName, modelIds]) => (
            <SelectGroup key={providerName}>
              <SelectLabel>{providerName}</SelectLabel>
              {modelIds.map(modelId => (
                <SelectItem
                  className='gap-1.5 pr-12'
                  key={`${providerName}|${modelId}`}
                  value={`${providerName}|${modelId}`}
                >
                  {modelId}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
      </SelectContent>
    </Select>
  );
};
