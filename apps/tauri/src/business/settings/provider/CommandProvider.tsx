import { CommandGroup, CommandItem } from '@allin/ui';
import { getProviderIcon } from '@/business/logo/ProviderIconMap';

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', description: 'GPT-4o, GPT-4, GPT-3.5' },
  { id: 'google', name: 'Google AI', description: 'Gemini Pro, Gemini Flash' },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude 3.5, Claude 3' },
] as const;

type CommandProviderProps = {
  onSelectProvider: (providerId: string) => void;
};

export const CommandProvider = ({ onSelectProvider }: CommandProviderProps) => {
  console.log('CommandProvider');
  return (
    <CommandGroup
      heading={<span className='text-blue-500 font-semibold'>Providers</span>}
    >
      {PROVIDERS.map(provider => (
        <CommandItem
          key={provider.id}
          onSelect={() => onSelectProvider(provider.id)}
        >
          {getProviderIcon(provider.id, 'size-4')}
          <div className='flex flex-col'>
            <span>{provider.name}</span>
          </div>
        </CommandItem>
      ))}
    </CommandGroup>
  );
};
