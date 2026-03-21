const HomePage = () => {
  return (
    <main className='relative mx-auto flex min-h-[calc(100vh-180px)] w-full max-w-4xl items-center px-4 py-14 sm:px-6 sm:py-20'>
      <div className='pointer-events-none absolute inset-0 -z-10 opacity-70 dark:opacity-100'>
        <div className='allin-float-slow absolute left-1/2 top-16 h-56 w-56 -translate-x-1/2 rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/20' />
        <div className='allin-float-soft absolute bottom-6 left-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-400/20' />
      </div>

      <section className='w-full text-black dark:text-white'>
        <h1 className='text-6xl font-semibold tracking-tight text-black dark:text-white sm:text-7xl'>
          ALLIN
        </h1>

        <p className='mt-6 max-w-2xl text-lg leading-8 text-neutral-600 dark:text-neutral-300 sm:text-xl'>
          Your Last AI Chat app.
        </p>
        <ul className='mt-4 space-y-1 text-base leading-7 text-neutral-500 dark:text-neutral-400 sm:text-lg'>
          <li>- Supports multiple providers (OpenAI, Claude, Google...)</li>
          <li>- Easy to customize</li>
          <li>- Nice GUI</li>
          <li>- Built for developers</li>
        </ul>

        <div className='mt-8'>
          <a
            href='https://github.com/gaki2/ALLIN/releases'
            target='_blank'
            rel='noreferrer noopener'
            className='inline-flex h-11 items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-black dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white'
          >
            Download for macOS
          </a>
          <div className='mt-3 flex flex-wrap items-center gap-2'>
            <span className='inline-flex items-center rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:border-white/20 dark:bg-white/10 dark:text-neutral-200'>
              Beta v26.3.21
            </span>
            <p className='text-sm text-neutral-500 dark:text-neutral-400'>
              Requires macOS Tahoe
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
