import { Badge, ScrollArea } from '@allin/ui';
import type { Skill } from '../types';

export const SkillContentViewer = ({ skill }: { skill: Skill | null }) => {
  if (!skill) {
    return (
      <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
        Select a skill to view its content.
      </div>
    );
  }

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='shrink-0 border-b px-6 py-4'>
        <div className='flex min-w-0 items-center gap-2'>
          <h1 className='truncate text-lg font-semibold tracking-tight'>
            {skill.name}
          </h1>
          {!skill.isValid && <Badge variant='destructive'>Invalid</Badge>}
        </div>

        <p className='mt-1 max-w-5xl font-mono text-sm text-muted-foreground'>
          {skill.description}
        </p>

        {skill.validationError && (
          <p className='mt-2 text-sm text-destructive'>
            {skill.validationError.message}
          </p>
        )}
      </div>

      <ScrollArea className='min-h-0 flex-1'>
        <pre className='whitespace-pre-wrap break-words p-6 font-mono text-sm leading-6'>
          {skill.content}
        </pre>
      </ScrollArea>
    </div>
  );
};
