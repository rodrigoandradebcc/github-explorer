import { Platform } from 'react-native';

import type { Theme } from '@/design-system';

interface GithubStackScreenOptionsParams {
  title: string | undefined;
  colors: Theme['colors'];
}

export function getGithubStackScreenOptions({ title, colors }: GithubStackScreenOptionsParams) {
  return {
    title,
    headerTransparent: Platform.OS === 'ios',
    headerBlurEffect: 'regular' as const,
    headerStyle: Platform.OS !== 'ios' ? { backgroundColor: colors.background } : undefined,
    headerTintColor: colors.text,
    headerBackTitle: '',
  };
}
