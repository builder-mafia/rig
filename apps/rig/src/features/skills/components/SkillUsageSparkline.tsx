import { cn } from '@allin/ui';

interface SkillUsageSparklineProps {
  values: number[];
  className?: string;
}

export const SkillUsageSparkline = ({
  values,
  className,
}: SkillUsageSparklineProps) => {
  const width = 36;
  const height = 28;
  const baseline = height / 2;
  const activeValues = values.filter(value => value > 0);

  if (activeValues.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden='true'
        className={cn(
          'shrink-0 overflow-visible text-muted-foreground',
          className,
        )}
      >
        <line
          x1='0'
          x2={width}
          y1={baseline}
          y2={baseline}
          stroke='currentColor'
          strokeDasharray='3 3'
          strokeLinecap='round'
          strokeWidth='1'
          opacity='0.7'
        />
      </svg>
    );
  }

  const max = Math.max(...values, 1);
  const step = width / Math.max(values.length, 1);
  const amplitude = baseline - 3;

  const points = values.flatMap((value, index) => {
    const startX = index * step;
    const peakX = startX + step / 2;
    const endX = startX + step;

    if (value === 0) {
      return [
        `${startX.toFixed(2)},${baseline.toFixed(2)}`,
        `${endX.toFixed(2)},${baseline.toFixed(2)}`,
      ];
    }

    const direction = index % 2 === 0 ? -1 : 1;
    const intensity = value / max;
    const peakY = baseline + direction * intensity * amplitude;

    return [
      `${startX.toFixed(2)},${baseline.toFixed(2)}`,
      `${peakX.toFixed(2)},${peakY.toFixed(2)}`,
      `${endX.toFixed(2)},${baseline.toFixed(2)}`,
    ];
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden='true'
      className={cn('shrink-0 overflow-visible text-blue-500', className)}
    >
      <polyline
        points={points.join(' ')}
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1'
      />
    </svg>
  );
};
