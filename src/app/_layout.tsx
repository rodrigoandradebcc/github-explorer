import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

import { ThemeProvider, useTheme } from '@/design-system';
import { ApplicationProvider } from '@/presentation/di/ApplicationProvider';
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
    <ApplicationProvider>
      <QueryProvider>
        <ThemeProvider>
          <ThemedStack />
        </ThemeProvider>
      </QueryProvider>
    </ApplicationProvider>
  );
}
