import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { useI18n } from '@/lib/preferences';
import { formatConfigValue, type ConfigField } from '../schema';
import type { ConfigPath, SaveConfigEdit } from '../types';
import { useConfigSave } from '../useConfigSave';

const inputClass =
  'min-w-0 w-full rounded border border-border bg-background px-2 py-1 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

type EditorInput =
  | {
      kind: 'select';
      options: { label: string; literal: string }[];
      initial: string;
    }
  | { kind: 'text' | 'integer' | 'number' | 'json'; initial: string };

function createInput(
  field: ConfigField,
  format: 'json' | 'toml' | 'text',
  masked: boolean,
): EditorInput {
  const value = field.configured ? field.value : undefined;
  const declared = Array.isArray(field.schema.type)
    ? field.schema.type
    : [field.schema.type];
  const preferred =
    declared.length === 1
      ? declared[0]
      : !field.configured
        ? declared.find(type => type && type !== 'null')
        : undefined;
  const kind = preferred ?? typeof (value ?? field.schema.default);
  const candidates =
    field.schema.enum ?? (kind === 'boolean' ? [true, false] : []);
  const options = masked
    ? []
    : candidates
        .filter(option =>
          option === null
            ? format === 'json'
            : ['string', 'number', 'boolean'].includes(typeof option),
        )
        .map(option => ({
          label: formatConfigValue(option),
          literal: JSON.stringify(option),
        }));
  const encoded = options.length ? JSON.stringify(value) : undefined;
  const currentOption = options.find(option => option.literal === encoded);
  if (options.length && (currentOption || !field.configured)) {
    return {
      kind: 'select',
      options,
      initial: currentOption?.literal ?? '',
    };
  }
  if (kind === 'string' || (masked && typeof value === 'string')) {
    return {
      kind: 'text',
      initial: typeof value === 'string' ? value : '',
    };
  }
  if (kind === 'integer' || kind === 'number') {
    return { kind, initial: typeof value === 'number' ? String(value) : '' };
  }
  const initial = value === undefined ? '' : JSON.stringify(value, null, 2);
  return { kind: 'json', initial };
}

export const ConfigValueEditor = ({
  field,
  path,
  format,
  revision,
  masked,
  save,
  reload,
  close,
}: {
  field: ConfigField;
  path: ConfigPath;
  format: 'json' | 'toml' | 'text';
  revision: string | null;
  masked: boolean;
  save: SaveConfigEdit;
  reload: () => void;
  close: () => void;
}) => {
  const { t } = useI18n();
  const [baseline] = useState(() => ({
    input: createInput(field, format, masked),
    revision,
  }));
  const { input } = baseline;
  const numeric = input.kind === 'number' || input.kind === 'integer';
  const [draft, setDraft] = useState(input.initial);
  const [invalid, setInvalid] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { submit, saving, failure, clearFailure } = useConfigSave(save, close);
  const changed = draft !== input.initial;
  useEffect(() => {
    // An outside click can land on a disabled control without moving focus.
    const commitOnOutsideClick = (event: PointerEvent) => {
      const form = formRef.current;
      if (
        form &&
        event.target instanceof Node &&
        !form.contains(event.target)
      ) {
        form.requestSubmit();
      }
    };
    document.addEventListener('pointerdown', commitOnOutsideClick, true);
    return () =>
      document.removeEventListener('pointerdown', commitOnOutsideClick, true);
  }, []);
  const saveValue = () => {
    if (saving || failure?.conflict) return;
    if (!changed) {
      close();
      return;
    }
    const empty = input.kind === 'text' ? draft === '' : draft.trim() === '';
    if (empty) {
      if (field.configured)
        void submit({ kind: 'removeProperty', path }, baseline.revision);
      else close();
      return;
    }
    const literal =
      input.kind === 'text' ? JSON.stringify(draft) : draft.trim();
    const numberPattern =
      input.kind === 'integer'
        ? /^-?(0|[1-9]\d*)$/
        : /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/;
    if (!literal || (numeric && !numberPattern.test(literal))) {
      setInvalid(true);
      return;
    }
    void submit({ kind: 'property', path, value: literal }, baseline.revision);
  };
  const change = (text: string) => {
    setDraft(text);
    if (invalid) setInvalid(false);
    if (failure && !failure.conflict) clearFailure();
  };
  const label = t('Value for {name}', { name: field.key });

  return (
    <form
      ref={formRef}
      onSubmit={event => {
        event.preventDefault();
        saveValue();
      }}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) saveValue();
      }}
      onKeyDown={event => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === 'Escape' && !saving) {
          event.preventDefault();
          close();
        }
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === 's'
        ) {
          event.preventDefault();
          saveValue();
        }
      }}
    >
      <div className='flex min-w-0 items-start gap-1'>
        {input.kind === 'select' ? (
          <select
            autoFocus
            aria-label={label}
            className={inputClass}
            disabled={saving}
            value={draft}
            onChange={event => change(event.target.value)}
          >
            <option value=''>{t('Not set')}</option>
            {input.options.map((option, index) => (
              <option key={index} value={option.literal}>
                {option.label}
              </option>
            ))}
          </select>
        ) : input.kind === 'json' || input.initial.includes('\n') ? (
          <textarea
            autoFocus
            aria-label={label}
            className={inputClass}
            rows={2}
            readOnly={saving}
            spellCheck={false}
            value={draft}
            onChange={event => change(event.target.value)}
          />
        ) : (
          <input
            autoFocus
            aria-label={label}
            className={inputClass}
            type={masked && input.kind === 'text' ? 'password' : 'text'}
            inputMode={numeric ? 'decimal' : undefined}
            readOnly={saving}
            autoCapitalize='none'
            autoComplete='off'
            autoCorrect='off'
            spellCheck={false}
            {...{ writingsuggestions: 'false' }}
            value={draft}
            onChange={event => change(event.target.value)}
          />
        )}
        <button
          type='submit'
          disabled={!changed || saving || failure?.conflict}
          aria-label={t('Save')}
          title={t('Save')}
          onPointerDown={event => event.preventDefault()}
          className='shrink-0 rounded p-1.5 text-primary hover:bg-muted disabled:opacity-50'
        >
          {saving ? (
            <Loader2 size={14} className='animate-spin' />
          ) : (
            <Check size={14} />
          )}
        </button>
        <button
          type='button'
          disabled={saving}
          onClick={close}
          aria-label={t('Cancel')}
          title={t('Cancel')}
          onPointerDown={event => event.preventDefault()}
          className='shrink-0 rounded p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-50'
        >
          <X size={14} />
        </button>
      </div>
      {(invalid || failure) && (
        <p role='alert' className='mt-1 text-[11px] text-destructive'>
          {failure?.message ?? t('Enter a valid value.')}
        </p>
      )}
      {failure?.conflict && (
        <button
          type='button'
          className='mt-1 text-[11px] underline'
          onClick={() => {
            close();
            reload();
          }}
        >
          {t('Discard edits and reload')}
        </button>
      )}
    </form>
  );
};
