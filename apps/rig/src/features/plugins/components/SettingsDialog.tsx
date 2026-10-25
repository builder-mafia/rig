import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Switch,
  toast,
} from '@allin/ui';
import { SkillProviderIcon } from '@/features/skills/components/SkillProviderIcon';
import {
  SKILL_SOURCES,
  type SkillSourceId,
} from '@/features/skills/skillSources';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hiddenSkillSourceIds: ReadonlySet<SkillSourceId>;
  onSkillSourceVisibilityChange: (
    sourceId: SkillSourceId,
    isVisible: boolean,
  ) => boolean;
}

export const SettingsDialog = ({
  open,
  onOpenChange,
  hiddenSkillSourceIds,
  onSkillSourceVisibilityChange,
}: SettingsDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className='gap-0 overflow-hidden rounded-xl p-0 sm:max-w-md'>
      <DialogHeader className='px-5 pb-4 pt-5 text-left'>
        <DialogTitle className='text-base'>Skill sources</DialogTitle>
        <DialogDescription className='text-xs leading-5'>
          Choose which sources appear in Rig. Files and agent access stay
          unchanged.
        </DialogDescription>
      </DialogHeader>
      <div className='border-t border-border/60 px-5'>
        {SKILL_SOURCES.map(source => (
          <div
            key={source.id}
            className='flex items-center gap-3 border-b border-border/50 py-3 last:border-0'
          >
            <SkillProviderIcon sourceId={source.id} size={18} />
            <label htmlFor={`source-${source.id}`} className='flex-1 text-sm'>
              {source.name}
            </label>
            <Switch
              id={`source-${source.id}`}
              checked={!hiddenSkillSourceIds.has(source.id)}
              onCheckedChange={visible => {
                if (!onSkillSourceVisibilityChange(source.id, visible))
                  toast.error('Couldn’t save skill sources. Try again.');
              }}
            />
          </div>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);
