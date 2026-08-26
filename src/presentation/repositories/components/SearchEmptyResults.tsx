import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { Box, Text, useTheme } from '@/design-system';

interface SearchEmptyResultsProps {
  query: string;
}

export function SearchEmptyResults({ query }: SearchEmptyResultsProps) {
  const { colors } = useTheme();

  return (
    <Box flex={1} align="center" justify="center" padding="xl" testID="empty-results">
      <Ionicons name="albums-outline" size={48} color={colors.border} />
      <Box paddingTop="md">
        <Text tone="muted" weight="medium">
          {`Nenhum resultado para "${query}"`}
        </Text>
      </Box>
      <Box paddingTop="xs">
        <Text tone="muted" size="sm">
          Tente outros termos de busca
        </Text>
      </Box>
    </Box>
  );
}
