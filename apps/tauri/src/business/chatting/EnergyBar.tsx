'use client';

export function EnergyBar({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  return (
    <div className='h-1 w-full overflow-hidden rounded-full bg-muted'>
      <div className='h-full w-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 energy-bar' />
    </div>
  );
}
