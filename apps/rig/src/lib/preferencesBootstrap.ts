// Apply the saved appearance before the first paint of the statically exported app.
export const preferencesBootstrap = `(${function () {
  let settings: { theme?: string; language?: string } = {};
  try {
    settings =
      JSON.parse(localStorage.getItem('rig:preferences:v1') || '{}') || {};
  } catch {}
  const dark =
    settings.theme === 'dark' ||
    (settings.theme !== 'light' &&
      matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  document.documentElement.lang = ['en', 'ko'].includes(settings.language || '')
    ? settings.language!
    : navigator.language.toLowerCase().startsWith('ko')
      ? 'ko'
      : 'en';
}.toString()})();`;
