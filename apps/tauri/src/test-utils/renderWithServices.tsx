import { type RenderOptions, render, renderHook } from '@testing-library/react';
import type { ReactElement } from 'react';
import {
  createServices,
  ServiceProvider,
  type Services,
} from '@/business/ServiceContext';

const createWrapper = (overrides: Partial<Services> = {}) => {
  const services = { ...createServices(), ...overrides };

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ServiceProvider value={services}>{children}</ServiceProvider>
  );

  return Wrapper;
};

export const renderWithServices = (
  ui: ReactElement,
  overrides: Partial<Services> = {},
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  return render(ui, { wrapper: createWrapper(overrides), ...options });
};

export const renderHookWithServices = <T,>(
  hook: () => T,
  overrides: Partial<Services> = {},
) => {
  return renderHook(hook, { wrapper: createWrapper(overrides) });
};
