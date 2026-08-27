import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

import { ThemeProvider, useTheme } from '@/design-system';
import {
  dataSourcePreference,
  dataSourceSelection,
  issueService,
  repoService,
  themePreference,
} from '@/infrastructure/di';
import { createQueryClient } from '@/infrastructure/query/queryClient';
import { ApplicationProvider } from '@/presentation/di/ApplicationProvider';
import { DataSourceProvider } from '@/presentation/di/DataSourceProvider';
import { QueryProvider } from '@/presentation/di/QueryProvider';

function ThemedStack() {
  const { colors, mode } = useTheme();
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerBackTitle: '',
          ...(Platform.OS === 'ios' ? { headerBackButtonDisplayMode: 'minimal' } : {}),
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <DataSourceProvider selection={dataSourceSelection} storage={dataSourcePreference}>
      <ApplicationProvider services={{ repoService, issueService }}>
        <QueryProvider createClient={createQueryClient}>
          <ThemeProvider storage={themePreference}>
            <ThemedStack />
          </ThemeProvider>
        </QueryProvider>
      </ApplicationProvider>
    </DataSourceProvider>
  );
}
