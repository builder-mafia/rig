import { bundledLanguages } from 'shiki/langs';
import type { BundledLanguage } from 'shiki/langs';
import { z } from 'zod/v4';

export type SupportedShikiLanguage = BundledLanguage | 'plaintext';

export const shikiLanguageSchema = z.custom<SupportedShikiLanguage>(
  value =>
    typeof value === 'string' &&
    (value === 'plaintext' || value in bundledLanguages),
);

export const normalizeShikiLanguage = (
  language: string,
): SupportedShikiLanguage => {
  const normalizedLanguage = language.trim().toLowerCase();
  const result = shikiLanguageSchema.safeParse(normalizedLanguage);

  return result.success ? result.data : 'plaintext';
};
