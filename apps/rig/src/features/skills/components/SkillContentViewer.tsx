import { useI18n } from '@/lib/preferences';
import type { Skill } from '../types';
import { getSkillIdentity } from '../useRemoveSkill';
import { useSkillDocumentSession } from '../useSkillDocument';
import { SkillHeader } from './SkillHeader';
import {
  SkillDocumentError,
  SkillDocumentShareButton,
  SkillSaveStatus,
  SkillTextEditor,
} from './SkillDocumentEditor';

export interface SkillContentViewerProps {
  skill: Skill | null;
  isHidden: boolean;
  hiddenFolderPath?: string;
  onShowFolder?: (path: string) => void;
  onBack: () => void;
  onHideSkill: (skill: Skill) => void;
  onShowSkill: (skill: Skill) => void;
  onRestoreArchivedSkill: (skill: Skill) => void;
  isRestoring: boolean;
}

export const SkillContentViewer = (props: SkillContentViewerProps) => {
  const { t } = useI18n();
  if (!props.skill)
    return (
      <div className='flex h-full items-center justify-center px-8'>
        <div className='text-center'>
          <h1 className='text-base font-medium'>{t('Select a skill')}</h1>
          <p className='mt-1.5 text-sm text-muted-foreground'>
            {t('Select a skill to edit its file.')}
          </p>
        </div>
      </div>
    );
  return (
    <SkillInspector
      key={getSkillIdentity(props.skill)}
      {...props}
      skill={props.skill}
    />
  );
};

const SkillInspector = (props: SkillContentViewerProps & { skill: Skill }) => {
  // Archived skills are not loaded through the editable file API.
  return props.skill.isArchived ? (
    <ArchivedSkill {...props} />
  ) : (
    <EditableSkill {...props} />
  );
};

const EditableSkill = (props: SkillContentViewerProps & { skill: Skill }) => {
  const { t } = useI18n();
  const session = useSkillDocumentSession(props.skill);
  return (
    <div
      className='flex h-full min-h-0 flex-col bg-background'
      onKeyDown={event => {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === 's'
        ) {
          event.preventDefault();
          if (!event.nativeEvent.isComposing) void session.save();
        }
      }}
    >
      <SkillHeader
        {...props}
        beforeOpen={session.save}
        shareAction={
          <SkillDocumentShareButton skill={props.skill} session={session} />
        }
        status={<SkillSaveStatus session={session} />}
      />
      <SkillDocumentError session={session} />
      <SkillTextEditor session={session} />
      <span id='skill-save-hint' className='sr-only'>
        {t(
          'Changes save automatically. Press Command or Control+S to save now.',
        )}
      </span>
    </div>
  );
};

const ArchivedSkill = (props: SkillContentViewerProps & { skill: Skill }) => {
  const { t } = useI18n();
  return (
    <div className='flex h-full min-h-0 flex-col bg-background'>
      <SkillHeader {...props} beforeOpen={async () => false} />
      <div className='border-b border-border/60 px-6 py-3 text-xs'>
        <p>{t('Restore this archived skill before editing.')}</p>
        <button
          type='button'
          disabled={props.isRestoring}
          onClick={() => props.onRestoreArchivedSkill(props.skill)}
          className='mt-2 rounded px-2 py-1 font-medium hover:bg-muted'
        >
          {props.isRestoring ? t('Restoring…') : t('Restore file')}
        </button>
      </div>
      <pre className='min-h-0 flex-1 overflow-auto whitespace-pre-wrap px-6 py-5 font-mono text-[13px] leading-6'>
        {props.skill.content}
      </pre>
    </div>
  );
};
