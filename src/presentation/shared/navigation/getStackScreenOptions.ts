import { Platform } from 'react-native';

import type { Theme } from '@/design-system';

interface StackScreenOptionsParams {
  title: string | undefined;
  colors: Theme['colors'];
}

export function getStackScreenOptions({ title, colors }: StackScreenOptionsParams) {
  return {
    title,
    headerTransparent: Platform.OS === 'ios',
    headerBlurEffect: 'regular' as const,
    headerStyle: Platform.OS !== 'ios' ? { backgroundColor: colors.background } : undefined,
    headerTintColor: colors.text,
    headerBackTitle: '',
  };
}
