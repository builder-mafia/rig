import Link from 'next/link';

export default function HomePage() {
  return (
    <div className='flex min-h-[calc(100vh-200px)] flex-col items-center justify-center gap-8 px-4 text-center'>
      <h1 className='text-5xl font-bold tracking-tight'>ALLIN</h1>
      <p className='max-w-xl text-lg text-gray-600 dark:text-gray-400'>
        An open-source AI all-in-one kit with chat interface and extensible
        features.
      </p>
    </div>
  );
}
