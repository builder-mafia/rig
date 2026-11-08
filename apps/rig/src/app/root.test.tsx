import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Root } from './root';

const roots = vi.hoisted(() => [
  { id: 'global', scopeKind: 'global' },
  { id: 'project', scopeKind: 'repository' },
]);
vi.mock('@/features/skills/useSkillRoots', () => ({
  useSkillRoots: () => ({ data: roots }),
}));
vi.mock('@/features/skills/skillSources', () => ({
  useSkillSourceVisibility: () => ({
    hiddenSourceIds: new Set(),
    setSourceVisible: vi.fn(),
  }),
}));
vi.mock('@/features/skills/components/SkillRoot', () => ({
  SkillRoot: ({ roots }: { roots: { id: string }[] }) => (
    <div>Visible roots: {roots.map(root => root.id).join(',')}</div>
  ),
}));
vi.mock('@/features/plugins/components/SettingsDialog', () => ({
  SettingsDialog: ({ open }: { open: boolean }) =>
    open ? <div>Settings open</div> : null,
}));
vi.mock('next/dynamic', () => ({
  default: () => () => <div>Configuration workspace</div>,
}));
afterEach(cleanup);

describe('workspace navigation', () => {
  it('only exposes global skills and switches to the configuration workspace without project controls', () => {
    render(<Root />);
    expect(screen.getByText('Visible roots: global')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /add project/i })).toBeNull();
    expect(screen.queryByText('project')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Config Hub' }));
    expect(screen.getByText('Configuration workspace')).toBeTruthy();
    expect(screen.queryByText('Visible roots: global')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Skills' }));
    expect(screen.getByText('Visible roots: global')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    expect(screen.getByText('Settings open')).toBeTruthy();
  });
});
