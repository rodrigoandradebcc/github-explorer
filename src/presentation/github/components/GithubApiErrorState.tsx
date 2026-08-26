import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { Box, Button, Text, useTheme } from '@/design-system';

interface GithubApiErrorStateProps {
  isRateLimit: boolean;
  genericMessage: string;
  testID: string;
  onRetry?: () => void;
  retryTestID?: string;
}

export function GithubApiErrorState({
  isRateLimit,
  genericMessage,
  testID,
  onRetry,
  retryTestID,
}: GithubApiErrorStateProps) {
  const { colors } = useTheme();

  return (
    <Box flex={1} align="center" justify="center" padding="xl" testID={testID}>
      {isRateLimit ? (
        <Box direction="column" align="center" gap="sm">
          <Ionicons name="warning-outline" size={48} color={colors.warning} />
          <Text weight="bold" tone="danger">
            Limite da API do GitHub atingido
          </Text>
          <Text tone="muted" size="sm">
            Adicione EXPO_PUBLIC_GITHUB_TOKEN no .env para aumentar o limite para 5.000
            requisições/hora.
          </Text>
        </Box>
      ) : (
        <Box direction="column" align="center" gap="md">
          <Ionicons name="cloud-offline-outline" size={48} color={colors.muted} />
          <Text tone="danger" weight="bold">
            Algo deu errado
          </Text>
          <Text tone="muted" size="sm">
            {genericMessage}
          </Text>
          {onRetry !== undefined && (
            <Button variant="outline" onPress={onRetry} testID={retryTestID}>
              Tentar novamente
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
