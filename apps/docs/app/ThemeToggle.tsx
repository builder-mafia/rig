'use client';

import { useMounted } from 'nextra/hooks';
import { MoonIcon, SunIcon } from 'nextra/icons';
import { useTheme } from 'nextra-theme-docs';

export const ThemeToggle = () => {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const Icon = mounted && resolvedTheme === 'dark' ? MoonIcon : SunIcon;

  return (
    <button
      type='button'
      aria-label='Toggle theme'
      className='x:cursor-pointer x:rounded x:p-2 x:transition-colors x:text-gray-600 x:hover:bg-gray-100 x:hover:text-gray-900 x:dark:text-gray-400 x:dark:hover:bg-neutral-800 x:dark:hover:text-gray-50'
      onClick={toggleTheme}
    >
      <Icon height='18' />
    </button>
  );
};
