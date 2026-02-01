import { FileText, Image, Languages, Sparkles, Wand2 } from 'lucide-react';
import type { SlashCommand, SlashCommandContext } from './types';

export const defaultSlashCommands: SlashCommand[] = [
  {
    id: 'compact',
    name: 'Compact',
    description: 'Compact the conversation or text',
    mode: 'action',
    execute: (context: SlashCommandContext) => {
      console.log(context);
    },
    icon: <FileText className='size-4' />,
    keywords: ['summary', 'tldr', 'recap'],
  },
  {
    id: 'translate',
    name: 'Translate',
    description: 'Translate text to another language',
    mode: 'template',
    template: 'Translate the following to $HINT:\n\n$INPUT',
    hints: ['Korean', 'English', 'Japanese', 'Chinese', 'Spanish', 'French'],
    icon: <Languages className='size-4' />,
    keywords: ['language', 'convert'],
  },
  {
    id: 'improve',
    name: 'Improve Writing',
    description: 'Improve the writing quality',
    mode: 'template',
    template: 'Improve the writing quality of the following text:\n\n$INPUT',
    icon: <Wand2 className='size-4' />,
    keywords: ['enhance', 'rewrite', 'better'],
  },
  {
    id: 'explain',
    name: 'Explain',
    description: 'Explain a concept or code',
    mode: 'template',
    template: 'Explain the following in detail:\n\n$INPUT',
    icon: <Sparkles className='size-4' />,
    keywords: ['describe', 'clarify', 'help'],
  },
  {
    id: 'image',
    name: 'Generate Image',
    description: 'Generate an image from description',
    mode: 'template',
    template: 'Generate an image: $INPUT',
    icon: <Image className='size-4' />,
    keywords: ['picture', 'draw', 'create'],
  },
];
