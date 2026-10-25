import { parseDiffFromFile } from '@pierre/diffs';
import { FileDiff } from '@pierre/diffs/react';
import { useMemo } from 'react';
import { usePreferences } from '@/lib/preferences';

export const SkillDiff = ({
  before,
  after,
}: {
  before: string;
  after: string;
}) => {
  const { resolvedTheme: themeType } = usePreferences();
  const fileDiff = useMemo(
    () =>
      parseDiffFromFile(
        { name: 'SKILL.md', contents: before, lang: 'markdown' },
        { name: 'SKILL.md', contents: after, lang: 'markdown' },
      ),
    [after, before],
  );

  return (
    <div className='overflow-hidden rounded-xl border bg-card text-xs [&_[data-diffs]]:font-mono'>
      <FileDiff
        fileDiff={fileDiff}
        disableWorkerPool
        options={{
          diffStyle: 'unified',
          diffIndicators: 'bars',
          lineDiffType: 'word',
          overflow: 'wrap',
          themeType,
          disableVirtualizationBuffers: true,
        }}
      />
    </div>
  );
};
