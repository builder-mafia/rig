import { memo, useState } from 'react';
import { Copy, Pencil, WrapText } from 'lucide-react';
import { Button, toast } from '@allin/ui';
import { useI18n } from '@/lib/preferences';
import type { SaveConfigEdit } from '../types';
import { useConfigSave } from '../useConfigSave';

export const ConfigSourceView = memo(function ConfigSourceView({
  content,
  revision,
  format,
  reading,
  save,
  reload,
  onEditingChange,
}: {
  content: string | null;
  revision: string | null;
  format: 'json' | 'toml' | 'text';
  reading: boolean;
  save: SaveConfigEdit;
  reload: () => void;
  onEditingChange: (active: boolean) => void;
}) {
  const { t } = useI18n();
  const [wrap, setWrap] = useState(true);
  const [draft, setDraft] = useState<{
    text: string;
    revision: string | null;
  } | null>(null);
  const finish = () => {
    setDraft(null);
    onEditingChange(false);
  };
  const { saving, submit, failure, clearFailure } = useConfigSave(save, finish);
  const dirty = draft !== null && draft.text !== content;
  const saveDraft = () => {
    if (!draft || !dirty || saving || failure?.conflict) return;
    const text =
      content?.includes('\r\n') && !/(?<!\r)\n/.test(content)
        ? draft.text.replace(/\r?\n/g, '\r\n')
        : draft.text;
    void submit({ kind: 'source', content: text }, draft.revision);
  };
  const displayed = draft?.text ?? content;
  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='flex shrink-0 flex-wrap items-center justify-end gap-2 border-b border-border/60 px-5 py-2'>
        {dirty && (
          <span role='status' className='mr-auto text-xs text-muted-foreground'>
            {t('Unsaved changes')}
          </span>
        )}
        <button
          type='button'
          aria-pressed={wrap}
          onClick={() => setWrap(value => !value)}
          className='inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-muted'
        >
          <WrapText size={13} />
          {t('Wrap lines')}
        </button>
        <button
          type='button'
          disabled={displayed === null}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(displayed ?? '');
              toast.success(t('Copied to clipboard'));
            } catch {
              toast.error(t('Couldn’t copy file content.'));
            }
          }}
          className='inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-muted disabled:opacity-50'
        >
          <Copy size={13} />
          {t('Copy file')}
        </button>
        {draft ? (
          <>
            <Button
              type='button'
              size='sm'
              variant='outline'
              disabled={saving}
              onClick={() => {
                clearFailure();
                finish();
              }}
            >
              {t('Cancel')}
            </Button>
            <Button
              type='button'
              size='sm'
              disabled={!dirty || saving || failure?.conflict}
              onClick={saveDraft}
            >
              {t(saving ? 'Saving…' : 'Save')}
            </Button>
          </>
        ) : (
          <Button
            type='button'
            size='sm'
            variant='outline'
            disabled={reading}
            onClick={() => {
              clearFailure();
              setDraft({
                text: content ?? (format === 'json' ? '{}\n' : ''),
                revision,
              });
              onEditingChange(true);
            }}
          >
            <Pencil size={13} />
            {t(content === null ? 'Create configuration file' : 'Edit source')}
          </Button>
        )}
      </div>
      {failure && (
        <div className='flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-5 py-2 text-xs'>
          <p role='alert' className='text-destructive'>
            {failure.message}
          </p>
          {failure.conflict && (
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                clearFailure();
                finish();
                reload();
              }}
            >
              {t('Discard edits and reload')}
            </Button>
          )}
        </div>
      )}
      {draft ? (
        <textarea
          aria-label={t('Edit configuration source')}
          className='min-h-0 flex-1 resize-none bg-background px-5 py-4 font-mono text-[13px] leading-6 outline-none'
          value={draft.text}
          readOnly={saving}
          wrap={wrap ? 'soft' : 'off'}
          autoCapitalize='none'
          autoCorrect='off'
          autoComplete='off'
          spellCheck={false}
          {...{ writingsuggestions: 'false' }}
          onChange={event => {
            const text = event.target.value;
            setDraft(previous => previous && { ...previous, text });
            if (failure && !failure.conflict) clearFailure();
          }}
          onKeyDown={event => {
            if (
              (event.metaKey || event.ctrlKey) &&
              event.key.toLowerCase() === 's'
            ) {
              event.preventDefault();
              saveDraft();
            }
          }}
        />
      ) : content !== null ? (
        <pre
          tabIndex={0}
          aria-label={t('Configuration source')}
          className={`min-h-0 flex-1 overflow-auto px-5 py-4 font-mono text-[13px] leading-6 ${wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}`}
        >
          {content}
        </pre>
      ) : (
        <p className='p-5 text-sm text-muted-foreground'>
          {t('No file content to display.')}
        </p>
      )}
    </div>
  );
});
