import { useRef, useState } from 'react';
import { useI18n } from '@/lib/preferences';
import { configErrorMessage, isConfigConflict } from './api';
import type { ConfigEdit, SaveConfigEdit } from './types';

export const useConfigSave = (save: SaveConfigEdit, onSaved: () => void) => {
  const { t } = useI18n();
  const inFlight = useRef(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<{
    conflict: boolean;
    message: string;
  } | null>(null);

  const submit = async (edit: ConfigEdit, revision: string | null) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    setFailure(null);
    try {
      await save(edit, revision);
      onSaved();
    } catch (error) {
      const conflict = isConfigConflict(error);
      setFailure({
        conflict,
        message: conflict
          ? t('This file changed in another app. Your edits are kept here.')
          : configErrorMessage(error),
      });
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  return { submit, saving, failure, clearFailure: () => setFailure(null) };
};
