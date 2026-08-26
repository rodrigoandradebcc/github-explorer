import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react-native';
import React from 'react';

import { ThemeProvider } from '@/design-system';
import { DataSourceSelection } from '@/domain/shared/DataSourceSelection';
import {
  ApplicationProvider,
  type ApplicationServices,
} from '@/presentation/di/ApplicationProvider';
import { DataSourceProvider } from '@/presentation/di/DataSourceProvider';

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  services?: Partial<ApplicationServices>;
  dataSourceSelection?: DataSourceSelection;
}

export function renderWithProviders(
  ui: React.ReactElement,
  { services, dataSourceSelection, ...options }: RenderWithProvidersOptions = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  const selection = dataSourceSelection ?? new DataSourceSelection('github');

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <DataSourceProvider selection={selection}>
        <ApplicationProvider services={services}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>{children}</ThemeProvider>
          </QueryClientProvider>
        </ApplicationProvider>
      </DataSourceProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
