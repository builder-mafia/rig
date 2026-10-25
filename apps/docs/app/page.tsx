import type { Metadata } from 'next';
import Image from 'next/image';
import claudeIcon from '../../rig/public/application_icon/claude-ai.svg';
import codexIcon from '../../rig/public/application_icon/openai.webp';
import openCodeDarkIcon from '../../rig/public/application_icon/opencode-dark.webp';
import openCodeLightIcon from '../../rig/public/application_icon/opencode-light.webp';
import appIcon from '../../rig/src-tauri/icons/icon.png';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Rig — Your skills, organized by folder',
  description:
    'Browse, copy, hide, and share SKILL.md files in a compact local desktop library.',
  openGraph: {
    title: 'Your skills, organized by folder.',
    description:
      'Browse global and project skills, copy instructions, and keep your library focused.',
    type: 'website',
  },
};

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

const skillRows = [
  {
    name: 'accessibility',
    description: 'Audit and improve web accessibility…',
    selected: true,
  },
  {
    name: 'agent-browser',
    description: 'Browser automation for AI agents…',
  },
  {
    name: 'vercel-react-best-practices',
    description: 'React and Next.js performance…',
  },
  {
    name: 'review-animations',
    description: 'Review motion against a high craft bar…',
  },
];

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

  return <Image src={codexIcon} alt='' width={size} height={size} />;
};

const DownloadButton = ({
  downloadUrl,
  label = 'Download for macOS',
}: {
  downloadUrl: string;
  label?: string;
}) => (
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
    {label}
  </a>
);

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

const CheckIcon = () => (
  <svg aria-hidden='true' viewBox='0 0 18 18' className='size-4' fill='none'>
    <path
      d='m4.25 9.25 3 3 6.5-7'
      stroke='currentColor'
      strokeWidth='1.6'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const SearchIcon = () => (
  <svg aria-hidden='true' viewBox='0 0 20 20' className='size-4' fill='none'>
    <circle
      cx='8.75'
      cy='8.75'
      r='5.25'
      stroke='currentColor'
      strokeWidth='1.4'
    />
    <path
      d='m12.5 12.5 4 4'
      stroke='currentColor'
      strokeWidth='1.4'
      strokeLinecap='round'
    />
  </svg>
);

const SkillRow = ({ skill }: { skill: (typeof skillRows)[number] }) => (
  <div
    className={`min-w-0 rounded-md px-3 py-2 text-left ${skill.selected ? 'bg-black/[0.05] dark:bg-white/[0.07]' : ''}`}
  >
    <p className='truncate text-xs font-medium'>{skill.name}</p>
    <p className='mt-0.5 truncate text-[10px] text-[#777a82] dark:text-[#9a9da5]'>
      {skill.description}
    </p>
  </div>
);

const FolderLibrary = () => (
  <div className='min-w-0 p-3 text-left'>
    <div className='mb-4 flex h-9 items-center gap-2 rounded-md border border-black/[0.08] px-2.5 text-xs text-[#898c93] dark:border-white/[0.1]'>
      <SearchIcon /> Search skills…
    </div>
    <p className='px-2 py-2 text-xs font-medium'>⌄ Global</p>
    <div className='pl-3'>
      <p className='px-2 py-2 font-mono text-[10px] text-[#777a82]'>
        ⌄ ~/.agents/skills
      </p>
      {skillRows.map(skill => (
        <SkillRow key={skill.name} skill={skill} />
      ))}
    </div>
    <p className='mt-3 px-2 py-2 text-xs font-medium'>⌄ acme-web</p>
    <div className='pl-3 text-[11px] text-[#777a82]'>
      <p className='px-2 py-2'>⌄ packages</p>
      <p className='px-5 py-2'>› frontend</p>
      <p className='px-5 py-2'>› backend</p>
    </div>
  </div>
);

const ProductWindow = () => (
  <figure className='rig-product-frame mx-auto mt-14 w-full max-w-[1180px] overflow-hidden rounded-xl border border-black/[0.1] bg-white dark:border-white/[0.12] dark:bg-[#141518]'>
    <div className='flex h-12 items-center gap-2 border-b border-black/[0.08] px-3 text-xs dark:border-white/[0.08]'>
      <span className='rounded-md bg-black/[0.06] px-3 py-2 dark:bg-white/[0.08]'>
        All skills
      </span>
      <span className='rounded-md px-3 py-2'>acme-web</span>
      <span className='text-[#777a82]'>+ Add project</span>
    </div>
    <div className='grid text-left md:grid-cols-[36%_64%]'>
      <div className='border-b border-black/[0.08] dark:border-white/[0.08] md:border-b-0 md:border-r'>
        <FolderLibrary />
      </div>
      <div className='p-6 sm:p-8'>
        <div className='flex items-center justify-between gap-4'>
          <h3 className='text-lg font-semibold'>accessibility</h3>
          <span className='text-xs text-[#777a82]'>Copy</span>
        </div>
        <p className='mt-2 text-sm text-[#777a82]'>
          Audit and improve web accessibility.
        </p>
        <p className='mt-3 break-all font-mono text-[10px] text-[#898c93]'>
          ~/.agents/skills/accessibility/SKILL.md
        </p>
        <div className='mt-6 flex gap-5 border-b border-black/[0.08] pb-3 text-xs dark:border-white/[0.08]'>
          <span>Instructions</span>
          <span className='text-[#777a82]'>Source</span>
          <span className='text-[#777a82]'>History</span>
        </div>
        <h4 className='mt-7 text-base font-semibold'>Accessibility review</h4>
        <p className='mt-4 text-sm leading-7 text-[#777a82]'>
          Review semantic structure, keyboard navigation, and focus states. Keep
          findings concrete and actionable.
        </p>
        <ol className='mt-4 list-inside list-decimal space-y-3 text-sm text-[#777a82]'>
          <li>Check headings and landmarks.</li>
          <li>Navigate every control with the keyboard.</li>
          <li>Verify contrast and reduced motion.</li>
        </ol>
      </div>
    </div>
    <figcaption className='sr-only'>
      Illustration of Rig’s compact folder library and skill instructions.
    </figcaption>
  </figure>
);

const SectionHeading = ({
  eyebrow,
  title,
  body,
  inverse = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  inverse?: boolean;
}) => (
  <div className='max-w-xl'>
    <p
      className={`text-xs font-semibold tracking-[0.08em] ${
        inverse ? 'text-[#9ca8ff]' : 'text-[#5267f8] dark:text-[#9ca8ff]'
      }`}
    >
      {eyebrow}
    </p>
    <h2
      className={`mt-4 text-[clamp(2.25rem,4.6vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.045em] ${
        inverse ? 'text-white' : 'text-[#15161a] dark:text-white'
      }`}
    >
      {title}
    </h2>
    <p
      className={`mt-5 text-base leading-7 ${
        inverse ? 'text-white/60' : 'text-[#666970] dark:text-[#a5a8af]'
      }`}
    >
      {body}
    </p>
  </div>
);

const LibraryVisual = () => (
  <div className='overflow-hidden rounded-xl border border-black/[0.1] bg-white dark:border-white/[0.1] dark:bg-[#151619]'>
    <FolderLibrary />
  </div>
);

const HistoryVisual = () => (
  <div className='grid overflow-hidden rounded-2xl border border-white/[0.12] bg-[#17181b] shadow-[0_26px_90px_rgba(0,0,0,.28)] md:grid-cols-[34%_66%]'>
    <div className='border-b border-white/[0.09] p-5 md:border-b-0 md:border-r'>
      <div className='flex items-center justify-between'>
        <p className='text-sm font-semibold text-white'>Version history</p>
        <span className='rounded-md border border-white/10 px-2 py-1 text-[9px] text-white/55'>
          3 saved
        </span>
      </div>
      <div className='mt-5 space-y-1'>
        {[
          ['Current', 'After restore', true],
          ['Today, 14:32', 'Before restore', false],
          ['Jul 28, 09:18', 'Restored version', false],
        ].map(([time, event, current]) => (
          <div
            key={time as string}
            className={`rounded-xl p-3 ${current ? 'bg-white/[0.08]' : ''}`}
          >
            <div className='flex items-center gap-2'>
              <span
                className={`size-1.5 rounded-full ${current ? 'bg-[#8392ff]' : 'bg-white/25'}`}
              />
              <p className='text-[11px] font-medium text-white'>{time}</p>
            </div>
            <p className='ml-3.5 mt-1 text-[9px] text-white/45'>{event}</p>
          </div>
        ))}
      </div>
      <span className='mt-6 flex h-9 w-full items-center justify-center rounded-lg border border-white/12 text-[10px] font-medium text-white/80'>
        Restore this version
      </span>
    </div>
    <div className='min-w-0 bg-[#202126] font-mono text-[10px] leading-5'>
      <div className='flex h-12 items-center justify-between border-b border-white/[0.08] px-4 text-white/55'>
        <span>SKILL.md</span>
        <span>Current ↔ Previous</span>
      </div>
      <div className='overflow-x-auto py-3 text-white/65'>
        <div className='min-w-[520px]'>
          <p className='bg-[#2f2430] px-4 text-[#f1a5af]'>
            <span className='mr-4 text-white/25'>12</span>- Run every audit
            automatically.
          </p>
          <p className='bg-[#203029] px-4 text-[#9ee0b5]'>
            <span className='mr-4 text-white/25'>12</span>+ Ask before running a
            full audit.
          </p>
          <p className='px-4'>
            <span className='mr-4 text-white/25'>13</span>&nbsp;
          </p>
          <p className='px-4'>
            <span className='mr-4 text-white/25'>14</span>## Review order
          </p>
          <p className='px-4'>
            <span className='mr-4 text-white/25'>15</span>1. Semantic structure
          </p>
          <p className='bg-[#203029] px-4 text-[#9ee0b5]'>
            <span className='mr-4 text-white/25'>16</span>+ 2. Keyboard and
            focus flow
          </p>
          <p className='bg-[#203029] px-4 text-[#9ee0b5]'>
            <span className='mr-4 text-white/25'>17</span>+ 3. Contrast and
            motion
          </p>
          <p className='px-4'>
            <span className='mr-4 text-white/25'>18</span>&nbsp;
          </p>
          <p className='px-4'>
            <span className='mr-4 text-white/25'>19</span>Keep findings concrete
            and actionable.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const ShareVisual = () => (
  <div>
    <div className='rounded-2xl border border-black/[0.1] bg-white p-5 dark:border-white/[0.1] dark:bg-[#151619]'>
      <div>
        <p className='text-xs font-semibold'>Share a skill</p>
        <p className='mt-1 text-[10px] text-[#85888f]'>
          Two clear ways to install.
        </p>
      </div>
      <div className='mt-5 space-y-3'>
        <div className='rounded-xl border border-black/[0.08] p-3 dark:border-white/[0.09]'>
          <p className='text-[11px] font-semibold'>Install with npx</p>
          <p className='mt-1 text-[9px] leading-4 text-[#7d8087]'>
            For skills with a tracked source.
          </p>
          <span className='mt-3 inline-flex rounded-lg bg-[#17181b] px-3 py-2 font-mono text-[9px] text-white dark:bg-white dark:text-[#17181b]'>
            Copy npx command
          </span>
        </div>
        <div className='rounded-xl border border-black/[0.08] p-3 dark:border-white/[0.09]'>
          <p className='text-[11px] font-semibold'>Install with AI</p>
          <p className='mt-1 text-[9px] leading-4 text-[#7d8087]'>
            Paste one prompt into your coding agent.
          </p>
          <span className='mt-3 inline-flex rounded-lg border border-black/[0.1] px-3 py-2 text-[9px] font-medium dark:border-white/[0.12]'>
            Copy install prompt
          </span>
        </div>
      </div>
    </div>
  </div>
);

const HomePage = async () => {
  const { downloadUrl, releaseVersion } = await getReleaseInfo();

  return (
    <main
      id='nextra-skip-nav'
      className='rig-home overflow-hidden bg-[#f8f8f6] text-[#15161a] dark:bg-[#0d0e10] dark:text-[#f4f4f5]'
    >
      <section className='rig-grid-background border-b border-black/[0.07] px-5 pb-20 pt-[clamp(5rem,9vw,8rem)] dark:border-white/[0.08] sm:px-8 lg:px-12'>
        <div className='mx-auto max-w-[1280px] text-center'>
          <p className='text-xs font-semibold tracking-[0.08em] text-[#5267f8] dark:text-[#9ca8ff]'>
            A local library for agent skills
          </p>
          <h1 className='mx-auto mt-6 max-w-5xl text-[clamp(3.25rem,7.2vw,5.75rem)] font-semibold leading-[0.96] tracking-[-0.055em] text-[#121316] dark:text-white'>
            Your agent skills,
            <br />
            one quiet workspace.
          </h1>
          <p className='mx-auto mt-7 max-w-3xl text-[clamp(1.0625rem,1.5vw,1.25rem)] leading-8 text-[#666970] dark:text-[#a5a8af]'>
            Browse Claude Code, Codex, OpenCode, and project skills in one
            compact library. Find a folder, read the instructions, and copy what
            you need.
          </p>
          <div className='mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center'>
            <DownloadButton downloadUrl={downloadUrl} />
            <a
              href='#product'
              className='rig-pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/[0.12] bg-white/70 px-5 text-sm font-semibold text-[#292a2f] transition-[background-color,transform] duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5267f8] focus-visible:ring-offset-2 dark:border-white/[0.13] dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1] dark:focus-visible:ring-offset-[#0d0e10]'
            >
              Explore the library <ArrowIcon />
            </a>
          </div>
          <p className='mt-4 text-xs text-[#85888f] dark:text-[#8d9098]'>
            Apple silicon · Version {releaseVersion} · Open source · No account
            required
          </p>
          <ProductWindow />
        </div>
      </section>

      <section
        aria-label='Supported coding agents'
        className='border-b border-black/[0.07] bg-white/50 px-5 dark:border-white/[0.08] dark:bg-white/[0.02] sm:px-8 lg:px-12'
      >
        <div className='mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-5 py-7 md:flex-row'>
          <div>
            <p className='text-center text-sm font-medium md:text-left'>
              One view across the agents you actually use
            </p>
            <p className='mt-1 text-center text-xs text-[#85888f] md:text-left'>
              Choose the sources you want to see. Your files stay in place.
            </p>
          </div>
          <div className='flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-[#5e6168] dark:text-[#b5b7bd]'>
            {[
              ['Claude Code', 'claude'],
              ['Codex', 'codex'],
              ['OpenCode', 'opencode'],
            ].map(([provider, source]) => (
              <span key={provider} className='flex items-center gap-2'>
                <span className='grid size-8 place-items-center rounded-lg border border-black/[0.09] bg-white dark:border-white/[0.1] dark:bg-[#17181b]'>
                  <ProviderIcon source={source} size={17} />
                </span>
                {provider}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section
        id='capabilities'
        className='scroll-mt-20 px-5 py-[clamp(7.5rem,10vw,10rem)] sm:px-8 lg:px-12'
      >
        <div className='mx-auto max-w-[1180px]'>
          <header className='grid lg:grid-cols-12 lg:gap-x-8'>
            <div className='max-w-[800px] lg:col-span-9 lg:col-start-3'>
              <p className='text-sm font-semibold leading-5 text-[#5267f8] dark:text-[#9ca8ff]'>
                What Rig helps you do
              </p>
              <h2 className='mt-4 text-[clamp(2.65rem,5.4vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.05em] text-[#15161a] dark:text-white'>
                <span className='block'>See what’s installed.</span>
                <span className='block'>Find the right folder.</span>
                <span className='block'>Keep your view focused.</span>
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
                <span className='inline-flex items-center rounded-full border border-black/[0.09] bg-white px-3 py-1.5 font-mono text-[11px] font-medium text-[#5f6269] dark:border-white/[0.1] dark:bg-[#151619] dark:text-[#b0b2b8]'>
                  Project SKILL.md
                </span>
              </div>
            </div>
          </header>

          <ol className='mt-14 border-t border-black/[0.1] dark:border-white/[0.12] lg:mt-20'>
            {[
              [
                'Folder navigation',
                'Global skills first, followed by projects and their nested folders.',
              ],
              [
                'Claude, Codex & OpenCode',
                'Browse agent and project skills without losing track of their source.',
              ],
              [
                'Skill sharing',
                'Copy an npx command or install prompt—no zip files.',
              ],
              [
                'Hide from Rig',
                'Keep a skill out of your view while leaving its files available to agents.',
              ],
              [
                'Version history',
                'Compare Rig snapshots and restore the version that worked.',
              ],
            ].map(([title, body], index) => (
              <li
                key={title}
                className='grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-b border-black/[0.1] py-7 dark:border-white/[0.12] sm:grid-cols-[4.75rem_minmax(0,1fr)] lg:grid-cols-12 lg:items-center lg:gap-x-8 lg:py-9'
              >
                <span className='col-start-1 text-[2rem] font-medium leading-none tracking-[-0.06em] tabular-nums text-[#5267f8] dark:text-[#9ca8ff] sm:text-[2.5rem] lg:col-span-2 lg:text-[3rem]'>
                  0{index + 1}
                </span>
                <h3 className='col-start-2 text-xl font-semibold leading-7 tracking-[-0.025em] lg:col-span-4 lg:col-start-3 lg:text-[1.375rem]'>
                  {title}
                </h3>
                <p className='col-start-2 max-w-[54ch] text-[15px] leading-6 text-[#5f6269] dark:text-[#b0b2b8] lg:col-span-6 lg:col-start-7 lg:text-base lg:leading-7'>
                  {body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id='product'
        className='scroll-mt-20 border-y border-black/[0.07] bg-white px-5 py-[clamp(7.5rem,10vw,10rem)] dark:border-white/[0.08] dark:bg-[#111214] sm:px-8 lg:px-12'
      >
        <div className='mx-auto grid max-w-[1180px] items-center gap-14 lg:grid-cols-12 lg:gap-8'>
          <div className='lg:col-span-5'>
            <SectionHeading
              eyebrow='01 · Multiple providers'
              title='Claude, Codex, OpenCode. One skill view.'
              body='Rig reads the skill folders already on your Mac. Global skills come first, followed by projects with expandable nested folders.'
            />
            <ul className='mt-8 space-y-3 text-sm text-[#5f6269] dark:text-[#b0b2b8]'>
              {[
                'Compact rows with full-text search',
                'Global and project folders',
                'Full instructions and exact file paths',
              ].map(point => (
                <li key={point} className='flex items-center gap-3'>
                  <span className='text-[#5267f8]'>
                    <CheckIcon />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className='lg:col-span-7'>
            <LibraryVisual />
          </div>
        </div>
      </section>

      <section className='bg-[#0d0e10] px-5 py-[clamp(7.5rem,10vw,10rem)] text-white sm:px-8 lg:px-12'>
        <div className='mx-auto max-w-[1180px]'>
          <div className='grid items-end gap-8 lg:grid-cols-[1fr_0.75fr]'>
            <SectionHeading
              inverse
              eyebrow='02 · Version history'
              title='Revisit saved versions.'
              body='Compare existing Rig snapshots and restore the version you trust. Rig saves recovery snapshots around each restore.'
            />
            <p className='text-sm leading-6 text-white/50 lg:pb-1'>
              History includes previous Rig snapshots and new restores. External
              file edits are not recorded automatically.
            </p>
          </div>
          <div className='mt-14'>
            <HistoryVisual />
          </div>
        </div>
      </section>

      <section className='border-b border-black/[0.07] bg-white px-5 py-[clamp(7.5rem,10vw,10rem)] dark:border-white/[0.08] dark:bg-[#111214] sm:px-8 lg:px-12'>
        <div className='mx-auto grid max-w-[1180px] items-center gap-14 lg:grid-cols-12 lg:gap-8'>
          <div className='lg:col-span-5'>
            <SectionHeading
              eyebrow='03 · Copy and share'
              title='Instructions, ready to copy.'
              body='Right-click a skill and choose Copy instructions. To share an installation, copy an npx command or an AI-ready install prompt.'
            />
            <p className='mt-7 text-sm leading-6 text-[#73767d] dark:text-[#9fa2a9]'>
              Install prompts include the current{' '}
              <code className='font-mono text-[0.9em]'>SKILL.md</code> content.
              Share them only with people and services you trust.
            </p>
          </div>
          <div className='lg:col-span-7'>
            <ShareVisual />
          </div>
        </div>
      </section>

      <section
        id='privacy'
        className='scroll-mt-20 px-5 py-[clamp(7.5rem,10vw,10rem)] sm:px-8 lg:px-12'
      >
        <div className='mx-auto max-w-[1180px]'>
          <div className='grid gap-12 lg:grid-cols-2 lg:gap-20'>
            <SectionHeading
              eyebrow='Local by default'
              title='Your skill files stay where your agents use them.'
              body='Rig reads and manages the SKILL.md files already on your Mac. Adding a project gives Rig another folder to scan—it does not copy your skills into a hosted workspace.'
            />
            <div className='rounded-2xl border border-black/[0.1] bg-white p-5 dark:border-white/[0.1] dark:bg-[#151619]'>
              <div className='space-y-3 font-mono text-[11px] text-[#6f7279] dark:text-[#a4a7ae]'>
                {[
                  '~/.claude/skills',
                  '~/.agents/skills',
                  'project/.agents/skills',
                ].map(path => (
                  <div key={path} className='flex items-center gap-3'>
                    <span className='size-2 rounded-full bg-[#5267f8]' />
                    <span>{path}</span>
                    <span className='ml-auto text-[#a5a8ae]'>──┐</span>
                  </div>
                ))}
              </div>
              <div className='my-5 flex items-center gap-3'>
                <span className='h-px flex-1 bg-black/[0.08] dark:bg-white/[0.1]' />
                <span className='grid size-12 place-items-center overflow-hidden rounded-xl shadow-sm'>
                  <Image src={appIcon} alt='Rig' width={48} height={48} />
                </span>
                <span className='h-px flex-1 bg-black/[0.08] dark:bg-white/[0.1]' />
              </div>
              <div className='grid grid-cols-3 gap-2 text-center text-[10px]'>
                {['Instructions', 'Source', 'History'].map(item => (
                  <span
                    key={item}
                    className='rounded-lg bg-[#f3f3f0] px-2 py-2.5 font-medium dark:bg-[#202125]'
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className='mt-14 grid gap-px overflow-hidden rounded-2xl border border-black/[0.1] bg-black/[0.08] dark:border-white/[0.1] dark:bg-white/[0.1] md:grid-cols-3'>
            {[
              [
                'Files stay on disk',
                'Rig reads known local roots and does not move files when you add a project.',
              ],
              [
                'Hidden only in Rig',
                'Hiding changes a local display preference. It never moves or disables your skill files.',
              ],
              [
                'Sharing is deliberate',
                'Skill content is exposed only when you choose to copy and send an install prompt.',
              ],
            ].map(([title, body]) => (
              <div key={title} className='bg-white p-6 dark:bg-[#151619]'>
                <h3 className='text-sm font-semibold'>{title}</h3>
                <p className='mt-3 text-sm leading-6 text-[#73767d] dark:text-[#9fa2a9]'>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='px-5 py-[clamp(7.5rem,10vw,10rem)] sm:px-8 lg:px-12'>
        <div className='mx-auto max-w-[900px]'>
          <div className='text-center'>
            <p className='text-xs font-semibold tracking-[0.08em] text-[#5267f8] dark:text-[#9ca8ff]'>
              Questions, answered
            </p>
            <h2 className='mt-4 text-[clamp(2.25rem,4.6vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.045em]'>
              Know what Rig changes.
            </h2>
          </div>
          <div className='mt-12 divide-y divide-black/[0.08] border-y border-black/[0.08] dark:divide-white/[0.1] dark:border-white/[0.1]'>
            {[
              [
                'Does Rig copy my skills into its own library?',
                'No. Rig reads skills from their existing folders. Adding a project gives Rig another folder to scan; it does not duplicate the files.',
              ],
              [
                'Do I need an agent integration?',
                'No. Rig reads local skill folders directly. Choose which sources appear in Skill sources.',
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
                <summary className='flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-4 text-left text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5267f8]'>
                  {question}
                  <span className='text-xl font-light text-[#777a82] transition-transform duration-150 group-open:rotate-45'>
                    +
                  </span>
                </summary>
                <p className='max-w-3xl pb-6 pr-10 text-sm leading-7 text-[#73767d] dark:text-[#9fa2a9]'>
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className='px-5 pb-20 sm:px-8 lg:px-12'>
        <div className='rig-grid-background mx-auto max-w-[1180px] overflow-hidden rounded-[24px] border border-black/[0.1] bg-white px-6 py-16 text-center shadow-[0_24px_80px_rgba(20,22,28,.08)] dark:border-white/[0.1] dark:bg-[#151619] sm:px-10 sm:py-20'>
          <p className='text-xs font-semibold tracking-[0.08em] text-[#5267f8] dark:text-[#9ca8ff]'>
            Ready when you are
          </p>
          <h2 className='mx-auto mt-5 max-w-3xl text-[clamp(2.5rem,5vw,4.25rem)] font-semibold leading-[1] tracking-[-0.05em]'>
            Make room for the skills you need.
          </h2>
          <p className='mx-auto mt-6 max-w-xl text-base leading-7 text-[#73767d] dark:text-[#9fa2a9]'>
            Browse your folders, copy instructions, and hide the skills you do
            not need in your daily view.
          </p>
          <div className='mt-8 flex flex-col justify-center gap-3 sm:flex-row'>
            <DownloadButton
              downloadUrl={downloadUrl}
              label='Download Rig for macOS'
            />
            <a
              href='/docs/skill-roots'
              className='rig-pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/[0.12] bg-white px-5 text-sm font-semibold transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5267f8] dark:border-white/[0.13] dark:bg-white/[0.06]'
            >
              Explore skill folders <ArrowIcon />
            </a>
          </div>
          <p className='mt-4 text-xs text-[#85888f]'>
            Free to download · Apple silicon
          </p>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
