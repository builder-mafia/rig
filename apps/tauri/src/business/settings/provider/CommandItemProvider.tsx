import { CommandItem } from '@allin/ui';
import { Plug } from 'lucide-react';

type CommandItemProviderProps = {
  onSelect?: () => void;
};

export const CommandItemProvider = ({ onSelect }: CommandItemProviderProps) => {
  return (
    <CommandItem onSelect={onSelect}>
      <Plug />
      <span>Connect Provider</span>
    </CommandItem>
  );
};
