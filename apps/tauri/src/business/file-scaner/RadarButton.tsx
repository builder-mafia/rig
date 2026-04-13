'use client';

import { cn } from '@allin/ui';

type RadarPoint = {
  n: number;
  y: number;
  r: number;
};

type RadarButtonProps = {
  active?: boolean;
  size?: number;
  points?: RadarPoint[];
  className?: string;
  onClick?: () => void;
  isDarkMode?: boolean;
};

const DEFAULT_POINTS: RadarPoint[] = [
  { n: 50, y: 50, r: 3 },
  { n: 170, y: 70, r: 3 },
  { n: 240, y: 80, r: 3 },
  { n: 270, y: 45, r: 3 },
];

export const RadarButton = ({
  active = true,
  size = 192,
  points = DEFAULT_POINTS,
  className,
  onClick,
  isDarkMode = false,
}: RadarButtonProps) => {
  const palette = isDarkMode
    ? {
        focusOutline: 'focus-visible:outline-zinc-700',
        backgroundColor: 'hsl(0 0% 9%)',
        outerBackground: 'hsl(0 0% 13%)',
        outerShadow: 'inset_0_0_0_1px_hsl(0_0%_21%)',
        highlight:
          'radial-gradient(50% 50% at 35% 0%, hsl(0 0% 85%) 0%, transparent 50%)',
        strokeLight:
          'conic-gradient(from 0deg, transparent, hsla(0, 0%, 100%, 0.5), transparent 90deg, transparent)',
        innerBackground: 'hsl(0 0% 9%)',
        innerGlow:
          'conic-gradient(from 0deg at 50% 50%, hsl(0 0% 15%) 0deg, hsl(0 0% 85%) 359.96deg, hsl(0 0% 85%) 360deg, hsl(0 0% 15%) 270deg)',
        innerGlowShadow: '0 12px 12px 4px rgba(0,0,0,0.3)',
        screenLine: 'hsl(0 0% 20%)',
        pointFill: 'hsl(0 0% 80%)',
        pointStroke: 'hsl(0 0% 70%)',
        sweep:
          'conic-gradient(from -90deg, transparent 0deg, hsla(0, 0%, 100%, 0.02) 280deg, hsla(0, 0%, 100%, 0.08) 330deg, hsla(0, 0%, 100%, 0.18) 350deg, transparent 360deg)',
      }
    : {
        focusOutline: 'focus-visible:outline-slate-300',
        backgroundColor: 'hsl(210 36% 97%)',
        outerBackground: 'hsl(210 34% 91%)',
        outerShadow: 'inset_0_0_0_1px_rgba(96,120,148,0.24)',
        highlight:
          'radial-gradient(50% 50% at 35% 0%, rgba(125,149,178,0.34) 0%, transparent 50%)',
        strokeLight:
          'conic-gradient(from 0deg, transparent, rgba(125,149,178,0.38), transparent 90deg, transparent)',
        innerBackground: 'hsl(210 40% 96%)',
        innerGlow:
          'conic-gradient(from 0deg at 50% 50%, rgba(191,219,254,0.10) 0deg, rgba(255,255,255,0.95) 220deg, rgba(125,149,178,0.42) 320deg, rgba(255,255,255,0.95) 360deg)',
        innerGlowShadow: '0 10px 18px 2px rgba(125,149,178,0.14)',
        screenLine: 'rgb(148 163 184)',
        pointFill: 'rgb(96 120 148)',
        pointStroke: 'rgb(71 85 105)',
        sweep:
          'conic-gradient(from -90deg, transparent 0deg, rgba(125,149,178,0.03) 280deg, rgba(125,149,178,0.12) 330deg, rgba(96,120,148,0.24) 350deg, transparent 360deg)',
      };

  return (
    <button
      type='button'
      aria-label='radar'
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'group relative flex aspect-square items-center justify-center rounded-full p-2',
        'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4',
        palette.focusOutline,
        className,
      )}
      style={
        {
          width: `${size}px`,
          backgroundColor: palette.backgroundColor,
        } as React.CSSProperties
      }
    >
      <div
        className='absolute inset-0 rounded-full [mask-composite:exclude] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]'
        style={{
          background: palette.outerBackground,
          boxShadow: palette.outerShadow.replaceAll('_', ' '),
        }}
      >
        <div
          className={cn(
            'absolute inset-0 rounded-full',
            active && 'radar-rotate',
          )}
          style={{
            background: palette.highlight,
            mixBlendMode: 'soft-light',
          }}
        />

        <div
          className='absolute inset-0 rounded-full'
          style={{
            mask: 'radial-gradient(circle, transparent 69%, black 70%)',
            WebkitMask: 'radial-gradient(circle, transparent 69%, black 70%)',
            background: palette.strokeLight,
          }}
        />
      </div>

      <div
        className='absolute inset-[4%] rounded-full'
        style={{ background: palette.innerBackground }}
      >
        <div
          className={cn(
            'absolute inset-0 z-[1] rounded-full blur-[3px]',
            active && 'radar-rotate',
          )}
          style={{
            background: palette.innerGlow,
            boxShadow: palette.innerGlowShadow,
            mixBlendMode: 'color-dodge',
          }}
        />

        <div className='absolute inset-0'>
          <svg
            version='1.1'
            width={size}
            height={size}
            viewBox='0 0 192 192'
            className='h-full w-full'
            fill='none'
          >
            <line
              x1='0'
              y1='96'
              x2='192'
              y2='96'
              stroke={palette.screenLine}
              strokeWidth='1'
            />
            <line
              x1='96'
              y1='0'
              x2='96'
              y2='192'
              stroke={palette.screenLine}
              strokeWidth='1'
            />
            <circle cx='96' cy='96' r='80' stroke={palette.screenLine} />
            <circle cx='96' cy='96' r='60' stroke={palette.screenLine} />
            <circle cx='96' cy='96' r='40' stroke={palette.screenLine} />
            <circle cx='96' cy='96' r='20' stroke={palette.screenLine} />
          </svg>

          <svg
            version='1.1'
            width='100%'
            height='100%'
            viewBox='0 0 192 192'
            className='absolute inset-0 h-full w-full overflow-visible'
          >
            {points.map(point => (
              <g
                key={`${point.n}-${point.y}-${point.r}`}
                transform={`translate(96 96) rotate(${point.n - 90})`}
              >
                <circle
                  r={point.r}
                  cx={point.y / 2}
                  cy={1}
                  className={cn(active && 'radar-point')}
                  style={
                    {
                      '--radar-delay': `${(point.n / 360) * 4}s`,
                    } as React.CSSProperties
                  }
                  fill={palette.pointFill}
                  stroke={palette.pointStroke}
                  strokeWidth='1'
                />
              </g>
            ))}
          </svg>

          <div
            className={cn(
              'absolute inset-0 rounded-full opacity-0',
              active && 'radar-sweep opacity-100',
            )}
            style={{
              background: palette.sweep,
            }}
          />
        </div>
      </div>
    </button>
  );
};
