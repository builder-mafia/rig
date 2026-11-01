import 'server-only';

import { cookies, headers } from 'next/headers';
import { cache } from 'react';
import { localeCookie, resolveLocale } from './i18n';

export const getRequestLocale = cache(async () => {
  const [cookieStore, requestHeaders] = await Promise.all([
    cookies(),
    headers(),
  ]);
  return resolveLocale(
    cookieStore.get(localeCookie)?.value,
    requestHeaders.get('accept-language') ?? '',
  );
});
