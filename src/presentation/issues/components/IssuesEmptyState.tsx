import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { Box, Button, Text, useTheme } from '@/design-system';

interface IssuesEmptyStateProps {
  onContinue?: () => void;
  isContinuing?: boolean;
}

export function IssuesEmptyState({ onContinue, isContinuing = false }: IssuesEmptyStateProps) {
  const { colors } = useTheme();
  const hasMoreToScan = onContinue !== undefined;

  return (
    <Box flex={1} align="center" justify="center" padding="xl" testID="issues-empty">
      <Ionicons
        name={hasMoreToScan ? 'search-outline' : 'checkmark-circle-outline'}
        size={52}
        color={colors.border}
      />
      <Box paddingTop="md">
        <Text tone="muted" size="lg" weight="medium">
          {hasMoreToScan ? 'Nenhuma issue nas páginas lidas' : 'Nenhuma issue aberta'}
        </Text>
      </Box>
      <Box paddingTop="xs">
        <Text tone="muted" size="sm">
          {hasMoreToScan
            ? 'As primeiras páginas trouxeram só pull requests. Continue para procurar nas próximas.'
            : 'Este repositório não tem issues abertas.'}
        </Text>
      </Box>
      {hasMoreToScan && (
        <Box paddingTop="md">
          <Button
            variant="outline"
            onPress={onContinue}
            disabled={isContinuing}
            testID="issues-continue-button"
          >
            {isContinuing ? 'Procurando…' : 'Continuar procurando'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
