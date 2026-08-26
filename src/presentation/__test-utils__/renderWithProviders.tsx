import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react-native';
import React from 'react';

import { ThemeProvider } from '@/design-system';
import {
  ApplicationProvider,
  type ApplicationServices,
} from '@/presentation/di/ApplicationProvider';

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  services?: Partial<ApplicationServices>;
}

export function renderWithProviders(
  ui: React.ReactElement,
  { services, ...options }: RenderWithProvidersOptions = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ApplicationProvider services={services}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryClientProvider>
      </ApplicationProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
