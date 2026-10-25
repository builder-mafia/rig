import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsDialog } from '@/features/plugins/components/SettingsDialog';
import {
  parsePreferences,
  PREFERENCES_KEY,
  PreferencesProvider,
  usePreferences,
} from './preferences';
import { preferencesBootstrap } from './preferencesBootstrap';
import { korean, translate, type Message } from './translations';

let dark = false;
let media: EventTarget;
beforeEach(() => {
  localStorage.clear();
  dark = false;
  media = new EventTarget();
  vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('en-US');
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return dark;
    },
    addEventListener: media.addEventListener.bind(media),
    removeEventListener: media.removeEventListener.bind(media),
  }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.classList.remove('dark');
});
const Preview = () => {
  const { t } = usePreferences();
  return <span>{t('All skills')}</span>;
};
const App = () => (
  <PreferencesProvider>
    <Preview />
    <SettingsDialog
      open
      onOpenChange={() => {}}
      hiddenSkillSourceIds={new Set()}
      onSkillSourceVisibilityChange={() => true}
    />
  </PreferencesProvider>
);

describe('language and appearance', () => {
  it('switches a live dialog and content together, persists choices and restores them on restart', () => {
    const { unmount } = render(<App />);
    fireEvent.change(screen.getByLabelText('Language'), {
      target: { value: 'ko' },
    });
    expect(screen.getByText('모든 스킬')).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(document.documentElement.lang).toBe('ko');
    fireEvent.change(screen.getByLabelText('화면 모드'), {
      target: { value: 'dark' },
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
    unmount();
    render(<App />);
    expect((screen.getByLabelText('언어') as HTMLSelectElement).value).toBe(
      'ko',
    );
    expect(
      (screen.getByLabelText('화면 모드') as HTMLSelectElement).value,
    ).toBe('dark');
    fireEvent.change(screen.getByLabelText('화면 모드'), {
      target: { value: 'light' },
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    fireEvent.change(screen.getByLabelText('언어'), {
      target: { value: 'en' },
    });
    expect(screen.getByText('All skills')).toBeTruthy();
  });
  it('tracks OS changes only while system appearance is selected', () => {
    render(<App />);
    act(() => {
      dark = true;
      media.dispatchEvent(new Event('change'));
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    fireEvent.change(screen.getByLabelText('Appearance'), {
      target: { value: 'light' },
    });
    act(() => {
      dark = false;
      media.dispatchEvent(new Event('change'));
      dark = true;
      media.dispatchEvent(new Event('change'));
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    fireEvent.change(screen.getByLabelText('Appearance'), {
      target: { value: 'system' },
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
  it('uses the system language initially, handles corrupt data and failed writes without losing the current setting', () => {
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('ko-KR');
    localStorage.setItem(PREFERENCES_KEY, '{bad json');
    render(<App />);
    expect(screen.getByText('모든 스킬')).toBeTruthy();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    fireEvent.change(screen.getByLabelText('언어'), {
      target: { value: 'en' },
    });
    expect(screen.getByText('모든 스킬')).toBeTruthy();
    expect(parsePreferences('{"theme":"unknown","language":"fr"}')).toEqual({
      theme: 'system',
      language: 'system',
    });
  });
  it('applies the saved theme before React and synchronizes external preference changes', () => {
    localStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({ language: 'ko', theme: 'dark' }),
    );
    window.eval(preferencesBootstrap);
    expect(document.documentElement.lang).toBe('ko');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    render(<App />);
    act(() => {
      localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify({ language: 'en', theme: 'light' }),
      );
      window.dispatchEvent(new Event('storage'));
    });
    expect(screen.getByText('All skills')).toBeTruthy();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
  it('keeps interpolation variables in every translation and treats user values as plain text', () => {
    for (const [en, ko] of Object.entries(korean))
      expect(ko.match(/\{\w+\}/g)?.sort() ?? [], en).toEqual(
        en.match(/\{\w+\}/g)?.sort() ?? [],
      );
    expect(
      translate('ko')('Share {name}', { name: '<script>{count}</script>' }),
    ).toBe('<script>{count}</script> 공유');
    for (const message of Object.keys(korean) as Message[])
      expect(translate('en')(message)).toBe(message);
  });
});
