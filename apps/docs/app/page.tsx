import Image from 'next/image';

export const revalidate = 3600;

const latestReleaseUrl =
  'https://raw.githubusercontent.com/builder-mafia/rig/main/apps/rig/latest.json';
const fallbackDownloadUrl = 'https://github.com/builder-mafia/rig/releases/latest';

interface LatestRelease {
  version: string;
  platforms?: {
    'darwin-aarch64'?: {
      url?: string;
    };
  };
}

const getReleaseInfo = async () => {
  try {
    const response = await fetch(latestReleaseUrl, {
      next: { revalidate },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch latest release: ${response.status}`);
    }

    const latestRelease = (await response.json()) as LatestRelease;
    const releaseVersion = latestRelease.version;
    const updaterUrl = latestRelease.platforms?.['darwin-aarch64']?.url;
    const downloadUrl =
      typeof updaterUrl === 'string' && updaterUrl.length > 0
        ? updaterUrl.replace(
            '/Rig.app.tar.gz',
            `/Rig_${releaseVersion}_aarch64.dmg`,
          )
        : `https://github.com/builder-mafia/rig/releases/download/v${releaseVersion}/Rig_${releaseVersion}_aarch64.dmg`;

    return {
      downloadUrl,
      releaseVersion,
    };
  } catch {
    return {
      downloadUrl: fallbackDownloadUrl,
      releaseVersion: 'latest',
    };
  }
};

const highlights = [
  'Browse SKILL.md files from global and project roots',
  'See which agent skills are actually being used',
  'Connect OpenCode and Claude Code usage logs locally',
];

const HomePage = async () => {
  const { downloadUrl, releaseVersion } = await getReleaseInfo();

  return (
    <main className='relative mx-auto flex min-h-[calc(100vh-180px)] w-full max-w-7xl items-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8 lg:py-20'>
      <div className='pointer-events-none absolute inset-0 -z-10 opacity-80 dark:opacity-100'>
        <div className='rig-float-slow absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/20' />
        <div className='rig-float-soft absolute bottom-8 left-8 h-48 w-48 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-400/20' />
      </div>

      <section className='grid w-full items-center gap-12 text-black dark:text-white lg:grid-cols-[0.92fr_1.08fr]'>
        <div>
          <p className='mb-5 inline-flex rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-neutral-600 backdrop-blur dark:border-white/15 dark:bg-white/10 dark:text-neutral-300'>
            Local-first agent skill workspace
          </p>
          <h1 className='flex max-w-3xl items-center gap-4 text-6xl font-semibold tracking-tight text-black dark:text-white sm:text-7xl lg:text-8xl'>
            Rig
          </h1>

          <p className='mt-6 max-w-2xl text-lg leading-8 text-neutral-600 dark:text-neutral-300 sm:text-xl'>
            Organize scattered agent SKILL files before they become a mess.
            Browse local skills, inspect their content, and track which ones are
            actually firing.
          </p>

          <ul className='mt-8 max-w-2xl space-y-3 text-sm text-neutral-600 dark:text-neutral-300 sm:text-base'>
            {highlights.map(highlight => (
              <li key={highlight} className='flex gap-3'>
                <span className='mt-2 size-2 shrink-0 rounded-full bg-neutral-900 dark:bg-white' />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>

          <div className='mt-10 flex flex-col gap-3 sm:flex-row sm:items-center'>
            <a
              href={downloadUrl}
              target='_blank'
              rel='noreferrer noopener'
              className='inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-black dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white'
            >
              <Image
                src='/apple-white.webp'
                alt=''
                width={32}
                height={32}
                className='h-4 w-auto dark:hidden'
              />
              <Image
                src='/apple.webp'
                alt=''
                width={32}
                height={32}
                className='hidden h-4 w-auto dark:block'
              />
              Download for macOS
            </a>
            <a
              href='/docs/getting-started'
              className='inline-flex h-11 items-center justify-center rounded-xl border border-black/10 bg-white/70 px-5 text-sm font-semibold text-neutral-800 transition-colors hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-neutral-100 dark:hover:bg-white/15'
            >
              Quick Start
            </a>
          </div>

          <div className='mt-4 flex flex-wrap items-center gap-2'>
            <span className='inline-flex items-center rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:border-white/20 dark:bg-white/10 dark:text-neutral-200'>
              Version {releaseVersion}
            </span>
            <p className='text-sm text-neutral-500 dark:text-neutral-400'>
              Apple silicon DMG from builder-mafia/rig releases
            </p>
          </div>
        </div>

        <div className='relative mx-auto w-full max-w-xl lg:max-w-none'>
          <div className='absolute -inset-4 rounded-[2.25rem] bg-gradient-to-br from-sky-400/20 via-transparent to-violet-500/20 blur-2xl' />
          <div className='relative overflow-hidden rounded-[2rem] border border-black/10 bg-white/70 p-2 shadow-2xl shadow-black/10 backdrop-blur dark:border-white/15 dark:bg-white/10 dark:shadow-black/30'>
            <Image
              src='/rig.png'
              alt='Rig app showing the skill list and usage dashboard'
              width={1646}
              height={1894}
              priority
              className='h-auto w-full rounded-[1.5rem]'
            />
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
