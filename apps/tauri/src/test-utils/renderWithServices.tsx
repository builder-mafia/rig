import { type RenderOptions, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import {
  createServices,
  ServiceProvider,
  type Services,
} from '@/business/ServiceContext';

export const renderWithServices = (
  ui: ReactElement,
  overrides: Partial<Services> = {},
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  const services = { ...createServices(), ...overrides };

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ServiceProvider value={services}>{children}</ServiceProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};
