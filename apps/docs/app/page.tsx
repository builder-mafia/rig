import type { Metadata } from 'next';
import Image from 'next/image';
import claudeIcon from '../../rig/public/application_icon/claude-ai.svg';
import codexIcon from '../../rig/public/application_icon/openai.webp';
import openCodeDarkIcon from '../../rig/public/application_icon/opencode-dark.webp';
import openCodeLightIcon from '../../rig/public/application_icon/opencode-light.webp';
import { getTranslator, type Locale } from './i18n';
import { getRequestLocale } from './locale-server';
import { ProductPreview } from './ProductPreview';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = getTranslator(await getRequestLocale());
  return {
    title: t('Rig — Your skills, organized by folder'),
    description: t(
      'Browse, copy, hide, and share SKILL.md files in a compact local desktop library.',
    ),
    openGraph: {
      title: t('Your skills, organized by folder.'),
      description: t(
        'Browse global and project skills, copy instructions, and keep your library focused.',
      ),
      type: 'website',
    },
  };
}

const latestReleaseUrl =
  'https://github.com/builder-mafia/rig/releases/latest/download/latest.json';
const fallbackDownloadUrl =
  'https://github.com/builder-mafia/rig/releases/latest';

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

    return { downloadUrl, releaseVersion };
  } catch {
    return { downloadUrl: fallbackDownloadUrl, releaseVersion: 'latest' };
  }
};

const ProviderIcon = ({
  source,
  size = 18,
}: {
  source: string;
  size?: number;
}) => {
  if (source === 'claude') {
    return <Image src={claudeIcon} alt='' width={size} height={size} />;
  }

  if (source === 'opencode') {
    return (
      <>
        <Image
          src={openCodeLightIcon}
          alt=''
          width={size}
          height={size}
          className='dark:hidden'
        />
        <Image
          src={openCodeDarkIcon}
          alt=''
          width={size}
          height={size}
          className='hidden dark:block'
        />
      </>
    );
  }

  return (
    <Image
      src={codexIcon}
      alt=''
      width={size}
      height={size}
      className='dark:invert'
    />
  );
};

const DownloadButton = ({
  downloadUrl,
  locale,
  label = 'Download for macOS',
}: {
  downloadUrl: string;
  locale: Locale;
  label?: string;
}) => {
  const t = getTranslator(locale);
  return (
    <a
      href={downloadUrl}
      target='_blank'
      rel='noreferrer noopener'
      className='rig-pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#17181b] px-5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5267f8] focus-visible:ring-offset-2 dark:bg-white dark:text-[#121316] dark:hover:bg-neutral-100 dark:focus-visible:ring-offset-[#0d0e10]'
    >
      <Image
        src='/apple-white.webp'
        alt=''
        width={32}
        height={32}
        className='h-4 w-auto dark:invert'
      />
      {t(label)}
    </a>
  );
};

const ArrowIcon = () => (
  <svg aria-hidden='true' viewBox='0 0 20 20' className='size-4' fill='none'>
    <path
      d='M4 10h11m-4-4 4 4-4 4'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const SectionHeading = ({
  title,
  body,
  inverse = false,
  locale,
}: {
  title: string;
  body: string;
  inverse?: boolean;
  locale: Locale;
}) => {
  const t = getTranslator(locale);
  return (
    <div className='max-w-xl'>
      <h2
        className={`text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.045em] ${inverse ? 'text-white' : 'text-[#15161a] dark:text-white'}`}
      >
        {t(title)}
      </h2>
      <p
        className={`mt-4 text-sm leading-6 ${inverse ? 'text-white/60' : 'text-[#666970] dark:text-[#a5a8af]'}`}
      >
        {t(body)}
      </p>
    </div>
  );
};

const HistoryVisual = ({ locale }: { locale: Locale }) => {
  const t = getTranslator(locale);
  return (
    <div className='grid gap-5 overflow-hidden rounded-xl border border-white/10 bg-[#171717] p-5 md:grid-cols-[220px_minmax(0,1fr)]'>
      <div>
        <div className='mb-3 flex items-center justify-between gap-3'>
          <p className='text-sm font-semibold text-white'>
            {t('Rig versions')}
          </p>
          <span className='text-xs text-white/50'>{t('Local only')}</span>
        </div>
        <div className='overflow-hidden rounded-xl border border-white/10'>
          {[
            ['Before restore', 'Today, 14:32', true],
            ['Restored previous version', 'Today, 14:31', false],
            ['Saved version', 'Oct 28, 09:18', false],
          ].map(([label, time, selected]) => (
            <div
              key={label as string}
              className={`border-b border-white/10 px-3 py-3 last:border-b-0 ${selected ? 'bg-white/[0.08]' : ''}`}
            >
              <p className='text-xs font-medium text-white'>
                {t(label as string)}
              </p>
              <p className='mt-1 text-[11px] text-white/50'>
                {t(time as string)}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className='min-w-0'>
        <div className='mb-3 flex min-h-8 items-center justify-between gap-4'>
          <div>
            <p className='text-sm font-semibold text-white'>
              {t('Before restore → Current')}
            </p>
            <p className='mt-1 text-xs text-white/50'>
              {t('Stacked diff · lines wrap to fit this window')}
            </p>
          </div>
          <span className='rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white'>
            {t('Restore')}
          </span>
        </div>
        <div className='overflow-hidden rounded-xl border border-white/10 bg-[#202020] py-3 font-mono text-xs leading-6 text-white/65'>
          {[
            [
              '12',
              '− Run every audit automatically.',
              'bg-[#2f2430] text-[#f1a5af]',
            ],
            [
              '12',
              '+ Ask before running a full audit.',
              'bg-[#203029] text-[#9ee0b5]',
            ],
            ['13', '', ''],
            ['14', '## Review order', ''],
            ['15', '1. Semantic structure', ''],
            [
              '16',
              '+ 2. Keyboard and focus flow',
              'bg-[#203029] text-[#9ee0b5]',
            ],
            ['17', '+ 3. Contrast and motion', 'bg-[#203029] text-[#9ee0b5]'],
            ['18', '', ''],
            ['19', 'Keep findings concrete and actionable.', ''],
          ].map(([line, content, style]) => (
            <div
              key={`${line}-${content}`}
              className={`flex gap-4 px-4 ${style}`}
            >
              <span className='w-4 shrink-0 text-white/25'>{line}</span>
              <span className='min-w-0 whitespace-pre-wrap break-words'>
                {content || ' '}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const HomePage = async () => {
  const [{ downloadUrl }, locale] = await Promise.all([
    getReleaseInfo(),
    getRequestLocale(),
  ]);
  const t = getTranslator(locale);

  return (
    <main
      id='nextra-skip-nav'
      className='rig-home overflow-hidden bg-[#f8f8f6] text-[#15161a] dark:bg-[#0d0e10] dark:text-[#f4f4f5]'
    >
      <section className='rig-grid-background border-b border-black/[0.07] px-5 pb-20 pt-[clamp(5rem,9vw,8rem)] dark:border-white/[0.08] sm:px-8 lg:px-12'>
        <div className='mx-auto max-w-[1280px] text-center'>
          <h1 className='mx-auto max-w-5xl text-[clamp(3.25rem,7.2vw,5.75rem)] font-semibold leading-[1.08] tracking-[-0.055em] text-[#121316] dark:text-white'>
            <span className='block'>{t('Your agent skills,')}</span>
            <span className='mt-2 block sm:mt-3'>
              {t('one quiet workspace.')}
            </span>
          </h1>
          <p className='mx-auto mt-7 max-w-3xl text-[clamp(1.0625rem,1.5vw,1.25rem)] leading-8 text-[#666970] dark:text-[#a5a8af]'>
            {t(
              'Bring scattered skills together. Manage and share them in one place.',
            )}
          </p>
          <div className='mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center'>
            <DownloadButton locale={locale} downloadUrl={downloadUrl} />
          </div>
          <ProductPreview />
        </div>
      </section>

      <section
        aria-label={t('Supported coding agents')}
        className='border-b border-black/[0.07] bg-white/50 px-5 dark:border-white/[0.08] dark:bg-white/[0.02] sm:px-8 lg:px-12'
      >
        <div className='mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-3 py-4 sm:flex-row'>
          <div>
            <p className='text-center text-sm font-medium md:text-left'>
              {t('One view across the agents you actually use')}
            </p>
          </div>
          <div className='flex shrink-0 items-center justify-center gap-5 sm:gap-6'>
            {[
              ['Claude Code', 'claude'],
              ['Codex', 'codex'],
              ['OpenCode', 'opencode'],
            ].map(([provider, source]) => (
              <span
                key={provider}
                title={provider}
                className='grid size-11 place-items-center'
              >
                <ProviderIcon source={source} size={32} />
                <span className='sr-only'>{provider}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section
        id='capabilities'
        className='scroll-mt-20 px-5 py-16 sm:py-20 lg:py-24 sm:px-8 lg:px-12'
      >
        <div className='mx-auto max-w-[1180px]'>
          <header className='grid lg:grid-cols-12 lg:gap-x-8'>
            <div className='max-w-[800px] lg:col-span-9 lg:col-start-3'>
              <h2 className='text-[clamp(2.25rem,4.5vw,3.75rem)] font-semibold leading-[0.98] tracking-[-0.05em] text-[#15161a] dark:text-white'>
                <span className='block'>{t('Find your skills.')}</span>
                <span className='block'>{t('Stay focused.')}</span>
              </h2>
              <div className='mt-7 flex flex-wrap gap-2'>
                {[
                  ['Claude Code', 'claude'],
                  ['Codex', 'codex'],
                  ['OpenCode', 'opencode'],
                ].map(([provider, source]) => (
                  <span
                    key={provider}
                    className='inline-flex items-center gap-2 rounded-full border border-black/[0.09] bg-white px-3 py-1.5 text-xs font-medium text-[#5f6269] dark:border-white/[0.1] dark:bg-[#151619] dark:text-[#b0b2b8]'
                  >
                    <ProviderIcon source={source} size={13} />
                    {provider}
                  </span>
                ))}
              </div>
            </div>
          </header>

          <ol className='mt-8 border-t border-black/[0.1] dark:border-white/[0.12] sm:mt-10'>
            {[
              [
                'Folder navigation',
                'Global and project skills, organized by folder.',
              ],
              [
                'Skill sharing',
                'Share skills with your teammates in a few clicks.',
              ],
              [
                'Remove and hide skills',
                'Delete skills you no longer need, or hide them from your view.',
              ],
              [
                'Version history',
                'Compare snapshots and restore a saved version.',
              ],
            ].map(([title, body], index) => (
              <li
                key={title}
                className='grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 gap-y-1 border-b border-black/[0.1] py-4 dark:border-white/[0.12] sm:grid-cols-[2.5rem_minmax(0,0.85fr)_minmax(0,1.15fr)] sm:items-center sm:gap-x-5 sm:py-5'
              >
                <span className='col-start-1 row-span-2 text-2xl font-medium leading-none tracking-[-0.05em] tabular-nums text-black dark:text-white sm:row-span-1'>
                  0{index + 1}
                </span>
                <h3 className='col-start-2 text-base font-semibold leading-6 tracking-[-0.02em]'>
                  {t(title)}
                </h3>
                <p className='col-start-2 max-w-[54ch] text-sm leading-6 text-[#5f6269] dark:text-[#b0b2b8] sm:col-start-3'>
                  {t(body)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className='bg-[#0d0e10] px-5 py-16 sm:py-20 lg:py-24 text-white sm:px-8 lg:px-12'>
        <div className='mx-auto max-w-[1180px]'>
          <div className='grid items-end gap-8 lg:grid-cols-[1fr_0.75fr]'>
            <SectionHeading
              locale={locale}
              inverse
              title='Revisit saved versions.'
              body='Compare existing Rig snapshots and restore the version you trust. Rig saves recovery snapshots around each restore.'
            />
            <p className='text-sm leading-6 text-white/50 lg:pb-1'>
              {t(
                'History includes previous Rig snapshots and new restores. External file edits are not recorded automatically.',
              )}
            </p>
          </div>
          <div className='mt-8 sm:mt-10'>
            <HistoryVisual locale={locale} />
          </div>
        </div>
      </section>

      <section
        id='sharing'
        className='border-b border-black/[0.07] bg-white px-5 py-10 dark:border-white/[0.08] dark:bg-[#111214] sm:px-8 sm:py-12 lg:px-12'
      >
        <div className='mx-auto grid max-w-[1180px] items-center gap-4 md:grid-cols-[0.85fr_1.15fr] md:gap-8'>
          <h2 className='text-[clamp(2rem,3.5vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.045em]'>
            {t('Share your skill')}
          </h2>
          <p className='max-w-xl text-sm leading-6 text-[#666970] dark:text-[#a5a8af]'>
            {t(
              'Share your skills with teammates using an install command or a prompt.',
            )}
          </p>
        </div>
      </section>

      <section className='px-5 py-16 sm:py-20 lg:py-24 sm:px-8 lg:px-12'>
        <div className='mx-auto max-w-[800px]'>
          <div className='text-center'>
            <h2 className='text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.02] tracking-[-0.045em]'>
              {t('Know what Rig changes.')}
            </h2>
          </div>
          <div className='mt-7 divide-y divide-black/[0.08] border-y border-black/[0.08] dark:divide-white/[0.1] dark:border-white/[0.1]'>
            {[
              [
                'Can I trust Rig?',
                'Yes. We do not operate any servers. All data is managed locally.',
              ],
              [
                'Does hiding a skill disable it for my agent?',
                'No. Hide from Rig only changes this app’s view. The skill stays in place and remains available to your agents.',
              ],
              [
                'What does version history include?',
                'Rig keeps previous snapshots and records recovery versions for restores performed inside Rig. External edits are not recorded automatically.',
              ],
            ].map(([question, answer]) => (
              <details key={question} className='group py-1'>
                <summary className='flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-2.5 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5267f8]'>
                  {t(question)}
                  <span className='text-xl font-light text-[#777a82] transition-transform duration-150 group-open:rotate-45'>
                    +
                  </span>
                </summary>
                <p className='max-w-3xl pb-4 pr-8 text-sm leading-6 text-[#73767d] dark:text-[#9fa2a9]'>
                  {t(answer)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className='px-5 pb-20 sm:px-8 lg:px-12'>
        <div className='rig-grid-background mx-auto max-w-[1180px] overflow-hidden rounded-2xl border border-black/[0.1] bg-white px-6 py-10 text-center shadow-[0_24px_80px_rgba(20,22,28,.08)] dark:border-white/[0.1] dark:bg-[#151619] sm:px-10 sm:py-12'>
          <h2 className='mx-auto max-w-3xl text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1] tracking-[-0.05em]'>
            {t('Make room for the skills you need.')}
          </h2>
          <div className='mt-6 flex flex-col justify-center gap-3 sm:flex-row'>
            <DownloadButton
              locale={locale}
              downloadUrl={downloadUrl}
              label='Download Rig for macOS'
            />
            <a
              href='/docs/skill-roots'
              className='rig-pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/[0.12] bg-white px-5 text-sm font-semibold transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5267f8] dark:border-white/[0.13] dark:bg-white/[0.06]'
            >
              {t('Explore skill folders')}
              <ArrowIcon />
            </a>
          </div>
          <p className='mx-auto mt-5 max-w-xl text-sm leading-6 text-[#5e6168] dark:text-[#b5b7bd]'>
            {t('All your data is securely managed locally.')}
          </p>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
