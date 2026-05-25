import Image from 'next/image';
import latestRelease from '../../rig/latest.json';

const releaseVersion = latestRelease.version;
const updaterUrl = latestRelease.platforms['darwin-aarch64']?.url;
const downloadUrl =
  typeof updaterUrl === 'string' && updaterUrl.length > 0
    ? updaterUrl.replace(
        '/ALLIN.app.tar.gz',
        `/ALLIN_${releaseVersion}_aarch64.dmg`,
      )
    : `https://github.com/gaki2/ALLIN/releases/download/v${releaseVersion}/ALLIN_${releaseVersion}_aarch64.dmg`;

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

        <p className='mt-6 max-w-3xl text-lg leading-8 text-neutral-600 dark:text-neutral-300 sm:text-xl'>
          All your settings files, in one place.
        </p>
        <div className='mt-8 max-w-2xl space-y-1 text-base leading-7 text-neutral-500 dark:text-neutral-400 sm:text-lg'>
          <p>
            <span className='font-semibold text-neutral-900 dark:text-white'>
              Don&apos;t
            </span>{' '}
            remember settings file paths.
          </p>
          <p>Save your time for the work that matters.</p>
        </div>

        <div className='mt-10'>
          <a
            href={downloadUrl}
            target='_blank'
            rel='noreferrer noopener'
            className='inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-black dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white'
          >
            <Image
              src='/apple-white.webp'
              alt='Apple'
              width={32}
              height={32}
              className='h-4 w-auto dark:hidden'
            />
            <Image
              src='/apple.webp'
              alt='Apple'
              width={32}
              height={32}
              className='hidden h-4 w-auto dark:block'
            />
            Download for macOS
          </a>
          <div className='mt-3 flex flex-wrap items-center gap-2'>
            <span className='inline-flex items-center rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:border-white/20 dark:bg-white/10 dark:text-neutral-200'>
              Version {releaseVersion}
            </span>
            <p className='text-sm text-neutral-500 dark:text-neutral-400'>
              Direct download for Apple silicon (.dmg)
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
