'use client';

import { useId, useState } from 'react';
import {
  FiArrowLeft,
  FiCheck,
  FiChevronDown,
  FiCopy,
  FiEyeOff,
  FiFolder,
  FiLayers,
  FiMoreHorizontal,
  FiPlus,
  FiSearch,
  FiSettings,
  FiShare2,
} from 'react-icons/fi';
import { useLanguage } from './LanguageProvider';

const skills = [
  {
    name: 'accessibility',
    description: 'Audit and improve web accessibility.',
    folder: '~/.agents/skills',
    project: false,
    title: 'Accessibility review',
    intro:
      'Make every interaction work for everyone. Review the interface, identify barriers, and turn findings into clear fixes.',
    steps: [
      'Check headings, landmarks, and semantic structure.',
      'Navigate every control with the keyboard.',
      'Verify color contrast and visible focus states.',
      'Respect reduced motion preferences.',
    ],
  },
  {
    name: 'agent-browser',
    description: 'Browser automation for AI agents.',
    folder: '~/.agents/skills',
    project: false,
    title: 'Explore the browser',
    intro:
      'Open a page, inspect what is on screen, and interact with the interface using concrete element references.',
    steps: [
      'Open the page you want to inspect.',
      'Read the page and identify the next action.',
      'Interact, then verify the result.',
    ],
  },
  {
    name: 'vercel-react-best-practices',
    description: 'React and Next.js performance guidelines.',
    folder: '~/.agents/skills',
    project: false,
    title: 'React best practices',
    intro:
      'Build fast, responsive React interfaces. Start with the changes that have the greatest effect on the user experience.',
    steps: [
      'Fetch independent data in parallel.',
      'Load optional components when they are needed.',
      'Keep client components small and focused.',
    ],
  },
  {
    name: 'review-animations',
    description: 'Review motion and interaction details.',
    folder: '~/.claude/skills',
    project: false,
    title: 'Review the motion',
    intro:
      'Every animation should help explain a change or give useful feedback. Keep everyday interactions quick and predictable.',
    steps: [
      'Give each animation a clear purpose.',
      'Check timing and interruption behavior.',
      'Provide a reduced motion alternative.',
    ],
  },
  {
    name: 'frontend-conventions',
    description: 'Interface patterns for the acme-web project.',
    folder: 'acme-web/.agents/skills',
    project: true,
    title: 'Frontend conventions',
    intro:
      'Follow the project’s component patterns. Prefer familiar building blocks and keep each change easy to review.',
    steps: [
      'Check existing components before adding a new one.',
      'Use the shared spacing and typography scale.',
      'Verify keyboard support and narrow screens.',
    ],
  },
];

type PreviewTab = 'Instructions' | 'Source' | 'History';
const tabs: PreviewTab[] = ['Instructions', 'Source', 'History'];

export function ProductPreview() {
  const { t } = useLanguage();
  const id = useId();
  const [projectOnly, setProjectOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedName, setSelectedName] = useState('accessibility');
  const [activeTab, setActiveTab] = useState<PreviewTab>('Instructions');
  const [mobileDetail, setMobileDetail] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const selected =
    skills.find(skill => skill.name === selectedName) ?? skills[0];
  const visibleSkills = skills.filter(
    skill =>
      (!projectOnly || skill.project) &&
      `${skill.name} ${skill.description} ${skill.folder}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const source = `---\nname: ${selected.name}\ndescription: ${selected.description}\n---\n\n# ${selected.title}\n\n${selected.intro}\n\n## Review checklist\n\n${selected.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}`;

  function selectSkill(name: string) {
    setSelectedName(name);
    setActiveTab('Instructions');
    setMobileDetail(true);
    setCopyStatus('');
  }

  async function copyInstructions() {
    try {
      await navigator.clipboard.writeText(source);
      setCopyStatus('Instructions copied');
    } catch {
      setCopyStatus('Could not copy. Select the text in Source to copy it.');
    }
  }

  return (
    <figure
      id='library'
      className='rig-preview rig-product-frame mx-auto mt-14 w-full max-w-[1180px] scroll-mt-24 overflow-hidden rounded-xl border text-left'
    >
      <div className='rig-preview-header flex h-14 items-center gap-2 border-b px-3 sm:px-4'>
        <nav
          aria-label={t('Preview projects')}
          className='flex min-w-0 items-center gap-1.5'
        >
          <button
            type='button'
            aria-pressed={!projectOnly}
            className='rig-preview-project'
            onClick={() => {
              setProjectOnly(false);
              setQuery('');
              selectSkill('accessibility');
              setMobileDetail(false);
            }}
          >
            <FiLayers aria-hidden='true' /> {t('All skills')}
          </button>
          <button
            type='button'
            aria-pressed={projectOnly}
            className='rig-preview-project'
            onClick={() => {
              setProjectOnly(true);
              setQuery('');
              selectSkill('frontend-conventions');
              setMobileDetail(false);
            }}
          >
            <FiFolder aria-hidden='true' /> acme-web
          </button>
          <span className='rig-preview-add hidden items-center gap-1.5 rounded-md border border-dashed px-2.5 py-1.5 text-xs sm:inline-flex'>
            <FiPlus aria-hidden='true' /> {t('Add project')}
          </span>
        </nav>
        <FiSettings
          aria-hidden='true'
          className='rig-preview-muted ml-auto shrink-0'
          size={16}
        />
      </div>

      <div className='rig-preview-layout grid h-[520px] sm:grid-cols-[minmax(0,34%)_minmax(0,66%)] lg:h-[560px] lg:grid-cols-[22rem_minmax(0,1fr)]'>
        <div
          className={`rig-preview-sidebar min-h-0 min-w-0 border-r ${mobileDetail ? 'hidden sm:flex' : 'flex'} flex-col`}
        >
          <div className='flex items-center gap-2 border-b p-3'>
            <label className='relative min-w-0 flex-1'>
              <FiSearch
                aria-hidden='true'
                className='rig-preview-muted pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2'
                size={14}
              />
              <span className='sr-only'>{t('Search preview skills')}</span>
              <input
                type='search'
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={t('Search skills…')}
                className='rig-preview-search h-8 w-full rounded-md border pl-8 pr-2 text-xs outline-none'
              />
            </label>
            <span
              className='rig-preview-muted inline-flex items-center gap-1.5 px-2 text-xs'
              title={t('Hidden skills')}
            >
              <FiEyeOff aria-hidden='true' size={14} /> 0
            </span>
          </div>
          <div className='min-h-0 overflow-y-auto px-2 py-2'>
            {(['Global', 'acme-web'] as const).map(group => {
              const groupSkills = visibleSkills.filter(
                skill => skill.project === (group === 'acme-web'),
              );
              if (!groupSkills.length) return null;
              const folders = [
                ...new Set(groupSkills.map(skill => skill.folder)),
              ];

              return (
                <details
                  key={`${group}-${query}-${projectOnly}`}
                  open
                  className='rig-preview-folder mb-2'
                >
                  <summary className='flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-medium'>
                    <FiChevronDown aria-hidden='true' size={13} />
                    <FiFolder
                      aria-hidden='true'
                      className='rig-preview-muted'
                      size={13}
                    />
                    {group === 'Global' ? t('Global') : group}
                    <span className='rig-preview-muted ml-auto text-[11px] font-normal tabular-nums'>
                      {groupSkills.length}
                    </span>
                  </summary>
                  <div className='ml-3'>
                    {folders.map(folder => (
                      <div key={folder}>
                        <p className='rig-preview-muted flex h-8 items-center gap-1.5 px-2 text-[11px]'>
                          <FiChevronDown aria-hidden='true' size={12} />
                          <span className='truncate'>
                            {folder.replace('acme-web/', '')}
                          </span>
                        </p>
                        <div className='ml-3'>
                          {groupSkills
                            .filter(skill => skill.folder === folder)
                            .map(skill => (
                              <button
                                key={skill.name}
                                type='button'
                                aria-pressed={selectedName === skill.name}
                                onClick={() => selectSkill(skill.name)}
                                className='rig-preview-skill block w-full min-w-0 rounded-md px-2.5 py-2 text-left'
                              >
                                <span className='block truncate text-[13px] font-medium leading-5'>
                                  {skill.name}
                                </span>
                                <span className='rig-preview-muted block truncate text-xs leading-4'>
                                  {skill.description}
                                </span>
                              </button>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
            {visibleSkills.length === 0 ? (
              <p className='rig-preview-muted px-3 py-8 text-center text-xs'>
                {t('No skills match your search.')}
              </p>
            ) : null}
          </div>
        </div>

        <div
          className={`min-h-0 min-w-0 flex-col ${mobileDetail ? 'flex' : 'hidden sm:flex'}`}
        >
          <div className='border-b px-5 pt-4 sm:px-6'>
            <button
              type='button'
              onClick={() => setMobileDetail(false)}
              className='rig-preview-muted mb-3 flex items-center gap-1 text-xs sm:hidden'
            >
              <FiArrowLeft aria-hidden='true' /> {t('Skills')}
            </button>
            <div className='flex items-start gap-3'>
              <div className='min-w-0 flex-1'>
                <h3 className='truncate text-base font-semibold tracking-[-0.02em]'>
                  {selected.name}
                </h3>
                <p className='rig-preview-muted mt-1 text-[13px] leading-5'>
                  {selected.description}
                </p>
              </div>
              <button
                type='button'
                onClick={copyInstructions}
                aria-label={t('Copy preview instructions')}
                className='rig-preview-muted rounded-md p-1.5'
              >
                {copyStatus === 'Instructions copied' ? (
                  <FiCheck size={15} />
                ) : (
                  <FiCopy size={15} />
                )}
              </button>
              <span className='rig-preview-muted hidden items-center gap-1.5 py-1.5 text-xs lg:inline-flex'>
                <FiShare2 aria-hidden='true' size={13} /> {t('Share')}
              </span>
              <FiMoreHorizontal
                aria-hidden='true'
                className='rig-preview-muted mt-1.5 shrink-0'
                size={16}
              />
            </div>
            <div className='mt-3 flex items-end justify-between gap-3'>
              <div
                role='tablist'
                aria-label={t('Preview skill content')}
                className='flex gap-5'
                onKeyDown={event => {
                  const index = tabs.indexOf(activeTab);
                  const next =
                    event.key === 'ArrowRight'
                      ? (index + 1) % tabs.length
                      : event.key === 'ArrowLeft'
                        ? (index + tabs.length - 1) % tabs.length
                        : event.key === 'Home'
                          ? 0
                          : event.key === 'End'
                            ? tabs.length - 1
                            : -1;
                  if (next < 0) return;
                  event.preventDefault();
                  setActiveTab(tabs[next]);
                  document.getElementById(`${id}-tab-${tabs[next]}`)?.focus();
                }}
              >
                {tabs.map(tab => (
                  <button
                    key={tab}
                    type='button'
                    role='tab'
                    id={`${id}-tab-${tab}`}
                    aria-selected={activeTab === tab}
                    aria-controls={`${id}-panel`}
                    tabIndex={activeTab === tab ? 0 : -1}
                    onClick={() => setActiveTab(tab)}
                    className='rig-preview-tab h-9 border-b text-xs font-medium'
                  >
                    {t(tab)}
                  </button>
                ))}
              </div>
              <details className='rig-preview-details relative mb-1'>
                <summary className='rig-preview-muted cursor-pointer rounded-md px-2 py-1 text-xs'>
                  {t('Details')}
                </summary>
                <div className='absolute right-0 top-full z-10 mt-2 w-60 rounded-lg border p-3 shadow-lg'>
                  <p className='rig-preview-muted mb-1 text-[10px]'>
                    {t('Location')}
                  </p>
                  <p className='break-all font-mono text-[11px]'>
                    {selected.folder}/{selected.name}/SKILL.md
                  </p>
                </div>
              </details>
            </div>
          </div>
          <div
            role='tabpanel'
            id={`${id}-panel`}
            aria-labelledby={`${id}-tab-${activeTab}`}
            className='min-h-0 flex-1 overflow-y-auto p-5 sm:p-6'
          >
            {activeTab === 'Instructions' ? (
              <article className='max-w-[68ch]'>
                <h4 className='text-[25px] font-semibold leading-tight tracking-[-0.035em] sm:text-[28px]'>
                  {selected.title}
                </h4>
                <p className='mt-4 text-[13px] leading-6'>{selected.intro}</p>
                <h5 className='mt-6 text-base font-semibold tracking-[-0.02em]'>
                  Review checklist
                </h5>
                <ol className='mt-3 list-decimal space-y-2 pl-5 text-[13px] leading-6'>
                  {selected.steps.map(step => (
                    <li key={step} className='pl-1'>
                      {step}
                    </li>
                  ))}
                </ol>
                <p className='rig-preview-muted mt-6 border-l-2 pl-3 text-xs leading-5'>
                  Keep findings concrete, actionable, and easy to verify.
                </p>
              </article>
            ) : activeTab === 'Source' ? (
              <pre className='rig-preview-code whitespace-pre-wrap break-words rounded-md p-4 font-mono text-xs leading-6'>
                <code>{source}</code>
              </pre>
            ) : (
              <div className='rounded-xl border border-dashed px-5 py-10 text-center'>
                <h4 className='text-sm font-semibold'>
                  {t('No Rig versions yet')}
                </h4>
                <p className='rig-preview-muted mx-auto mt-2 max-w-xs text-xs leading-5'>
                  {t(
                    'Saved versions and recovery snapshots appear here when available.',
                  )}
                </p>
              </div>
            )}
            <output className='rig-preview-muted mt-4 block text-xs'>
              {t(copyStatus)}
            </output>
          </div>
        </div>
      </div>
      <figcaption className='sr-only'>
        {t(
          'Interactive preview of Rig’s folder library. Search skills, switch projects, and explore instructions, source, and history.',
        )}
      </figcaption>
    </figure>
  );
}
