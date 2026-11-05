import { useI18n } from '@/lib/preferences';
import { toast } from '@allin/ui';
import type { Skill } from '../types';
import {
  type SkillDocumentSession,
  useSkillDocumentContent,
  useSkillDocumentReadiness,
  useSkillDocumentStatus,
} from '../useSkillDocument';
import { ShareSkillButton } from './ShareSkillDialog';

type Props = { session: SkillDocumentSession };

export const SkillSaveStatus = ({ session }: Props) => {
  const { t } = useI18n();
  const { saving, dirty } = useSkillDocumentStatus(session);
  return (
    <span role='status' className='text-[11px] text-muted-foreground'>
      {saving ? t('Saving…') : dirty ? t('Unsaved changes') : ''}
    </span>
  );
};

export const SkillDocumentShareButton = ({
  session,
  skill,
}: Props & { skill: Skill }) => {
  const readiness = useSkillDocumentReadiness(session);
  return (
    <ShareSkillButton
      skill={skill}
      getFileContent={session.getContentSnapshot}
      disabled={readiness !== 'ready'}
    />
  );
};

export const SkillDocumentError = ({ session }: Props) => {
  const { t } = useI18n();
  const document = useSkillDocumentStatus(session);
  return (
    <>
      {document.error ? (
        <div
          role='alert'
          className='flex flex-wrap items-center gap-3 border-b border-border/60 px-6 py-2 text-xs'
        >
          <span className='text-destructive'>
            {t(
              document.error === 'conflict'
                ? 'This file changed in another app. Your edits are kept here.'
                : document.error === 'load'
                  ? 'Couldn’t read this skill file.'
                  : 'Couldn’t save changes. Your edits are kept here.',
            )}
          </span>
          {document.error !== 'conflict' ? (
            <button
              type='button'
              className='underline underline-offset-4'
              onClick={() =>
                void (document.dirty ? session.save() : session.load())
              }
            >
              {t('Retry')}
            </button>
          ) : null}
          {document.dirty ? (
            <>
              <button
                type='button'
                className='underline underline-offset-4'
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      session.getContentSnapshot(),
                    );
                    toast.success(t('Edits copied'), {
                      position: 'top-center',
                    });
                  } catch {
                    toast.error(t('Couldn’t copy instructions.'));
                  }
                }}
              >
                {t('Copy my edits')}
              </button>
              <button
                type='button'
                className='underline underline-offset-4'
                onClick={() => void session.discardAndReload()}
              >
                {t('Discard edits and reload')}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
};

export const SkillTextEditor = ({ session }: Props) => {
  const { t } = useI18n();
  const content = useSkillDocumentContent(session);
  const readiness = useSkillDocumentReadiness(session);
  return (
    <>
      {readiness === 'loading' ? (
        <p className='px-6 py-5 text-sm text-muted-foreground'>
          {t('Loading file…')}
        </p>
      ) : (
        <textarea
          aria-label={t('Skill file content')}
          aria-describedby='skill-save-hint'
          value={content}
          disabled={readiness !== 'ready'}
          onChange={event => session.change(event.target.value)}
          onCompositionStart={() => session.composition(true)}
          onCompositionEnd={() => session.composition(false)}
          autoCapitalize='off'
          autoCorrect='off'
          spellCheck={false}
          className='min-h-0 w-full flex-1 resize-none border-0 bg-transparent px-6 py-5 font-mono text-[13px] leading-6 text-foreground outline-none selection:bg-foreground/15 disabled:opacity-50'
        />
      )}
    </>
  );
};
