import { FileText, Image, Languages, Sparkles, Wand2 } from 'lucide-react';
import type { SlashCommand } from './types';

export const defaultSlashCommands: SlashCommand[] = [
  {
    id: 'summarize',
    name: 'Summarize',
    description: 'Summarize the conversation or text',
    category: 'ai',
    mode: 'template',
    template: 'Summarize the following:\n\n$ARGUMENTS',
    icon: <FileText className='size-4' />,
    keywords: ['summary', 'tldr', 'recap'],
  },
  {
    id: 'translate',
    name: 'Translate',
    description: 'Translate text to another language',
    category: 'ai',
    mode: 'template',
    template: 'Translate the following to $1:\n\n$ARGUMENTS',
    hints: ['Korean', 'English', 'Japanese', 'Chinese', 'Spanish', 'French'],
    icon: <Languages className='size-4' />,
    keywords: ['language', 'convert'],
  },
  {
    id: 'improve',
    name: 'Improve Writing',
    description: 'Improve the writing quality',
    category: 'ai',
    mode: 'template',
    template:
      'Improve the writing quality of the following text:\n\n$ARGUMENTS',
    icon: <Wand2 className='size-4' />,
    keywords: ['enhance', 'rewrite', 'better'],
  },
  {
    id: 'explain',
    name: 'Explain',
    description: 'Explain a concept or code',
    category: 'ai',
    mode: 'template',
    template: 'Explain the following in detail:\n\n$ARGUMENTS',
    icon: <Sparkles className='size-4' />,
    keywords: ['describe', 'clarify', 'help'],
  },
  {
    id: 'image',
    name: 'Generate Image',
    description: 'Generate an image from description',
    category: 'ai',
    mode: 'template',
    template: 'Generate an image: $ARGUMENTS',
    icon: <Image className='size-4' />,
    keywords: ['picture', 'draw', 'create'],
  },
];
