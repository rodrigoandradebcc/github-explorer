import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

export type BadgeTone = 'default' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  tone?: BadgeTone;
  size?: BadgeSize;
  children: React.ReactNode;
  testID?: string;
}

const BG_ALPHA = '26'; // ~15% opacity
const BORDER_ALPHA = '66'; // ~40% opacity

export function Badge({ tone = 'default', size = 'md', children, testID }: BadgeProps) {
  const { colors, spacing, sizes } = useTheme();

  const toneStyles = {
    default: { bg: colors.surface, text: colors.text, border: colors.border },
    success: {
      bg: colors.success + BG_ALPHA,
      text: colors.success,
      border: colors.success + BORDER_ALPHA,
    },
    warning: {
      bg: colors.warning + BG_ALPHA,
      text: colors.warning,
      border: colors.warning + BORDER_ALPHA,
    },
    danger: {
      bg: colors.danger + BG_ALPHA,
      text: colors.danger,
      border: colors.danger + BORDER_ALPHA,
    },
    info: {
      bg: colors.info + BG_ALPHA,
      text: colors.info,
      border: colors.info + BORDER_ALPHA,
    },
  }[tone];

  const sizeStyles = {
    sm: { paddingVertical: 2, paddingHorizontal: spacing.xs, fontSize: sizes.xs },
    md: { paddingVertical: 4, paddingHorizontal: spacing.sm, fontSize: sizes.sm },
  }[size];

  return (
    <View
      testID={testID}
      style={{
        backgroundColor: toneStyles.bg,
        borderWidth: 1,
        borderColor: toneStyles.border,
        // large radius creates pill shape regardless of content height
        borderRadius: 100,
        paddingVertical: sizeStyles.paddingVertical,
        paddingHorizontal: sizeStyles.paddingHorizontal,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontSize: sizeStyles.fontSize,
          color: toneStyles.text,
          fontWeight: '500',
        }}
      >
        {children}
      </Text>
    </View>
  );
}
