import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { Box, Text, useTheme } from '@/design-system';

export function IssuesEmptyState() {
  const { colors } = useTheme();

  return (
    <Box flex={1} align="center" justify="center" padding="xl" testID="issues-empty">
      <Ionicons name="checkmark-circle-outline" size={52} color={colors.border} />
      <Box paddingTop="md">
        <Text tone="muted" size="lg" weight="medium">
          Nenhuma issue aberta
        </Text>
      </Box>
      <Box paddingTop="xs">
        <Text tone="muted" size="sm">
          Este repositório não tem issues abertas.
        </Text>
      </Box>
    </Box>
  );
}
