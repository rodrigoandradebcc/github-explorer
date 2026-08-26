import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { Text, useTheme } from '@/design-system';

interface RepositoryStatItemProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  label: string;
  iconColor: string;
}

export function RepositoryStatItem({ icon, value, label, iconColor }: RepositoryStatItemProps) {
  const { spacing } = useTheme();

  return (
    <View
      style={{
        width: '50%',
        alignItems: 'center',
        paddingVertical: spacing.sm,
      }}
    >
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text weight="bold" size="lg">
        {value}
      </Text>
      <Text size="xs" tone="muted">
        {label}
      </Text>
    </View>
  );
}
