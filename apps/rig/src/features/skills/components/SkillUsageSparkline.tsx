import { cn } from '@allin/ui';

interface SkillUsageSparklineProps {
  values: number[];
  className?: string;
}

export const SkillUsageSparkline = ({
  values,
  className,
}: SkillUsageSparklineProps) => {
  const width = 30;
  const height = 28;
  const baseline = height / 2;
  const hasUsage = values.some(value => value > 0);
  const points = sampleValues(values, 6);
  const max = Math.max(...points, 1);
  const step = width / Math.max(points.length - 1, 1);
  const amplitude = baseline - 4;

  const path = hasUsage
    ? points.reduce(
        (path, value, index) => {
          const startX = index * step;

          if (value === 0) {
            return `${path} L ${startX.toFixed(2)} ${baseline.toFixed(2)}`;
          }

          const direction = index % 2 === 0 ? -1 : 1;
          const intensity = value / max;
          const peakY = baseline + direction * intensity * amplitude;

          return `${path} L ${startX.toFixed(2)} ${peakY.toFixed(2)}`;
        },
        `M 0 ${baseline.toFixed(2)}`,
      )
    : `M 0 ${baseline.toFixed(2)} L ${width} ${baseline.toFixed(2)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden='true'
      className={cn(
        'shrink-0 overflow-visible text-blue-500',
        !hasUsage && 'text-muted-foreground',
        className,
      )}
    >
      <path
        d={path}
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.5'
        opacity={hasUsage ? '0.9' : '0.45'}
      />
    </svg>
  );
};

const sampleValues = (values: number[], size: number) => {
  if (values.length <= size) {
    return values;
  }

  const bucketSize = values.length / size;

  return Array.from({ length: size }, (_, index) => {
    const start = Math.floor(index * bucketSize);
    const end = Math.max(start + 1, Math.floor((index + 1) * bucketSize));
    const bucket = values.slice(start, end);

    return Math.max(...bucket, 0);
  });
};
