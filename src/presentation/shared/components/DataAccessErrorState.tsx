import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { Box, Button, Text, useTheme } from '@/design-system';

interface DataAccessErrorStateProps {
  isRateLimit: boolean;
  genericMessage: string;
  testID: string;
  onRetry?: () => void;
  retryTestID?: string;
}

export function DataAccessErrorState({
  isRateLimit,
  genericMessage,
  testID,
  onRetry,
  retryTestID,
}: DataAccessErrorStateProps) {
  const { colors } = useTheme();

  return (
    <Box flex={1} align="center" justify="center" padding="xl" testID={testID}>
      {isRateLimit ? (
        <Box direction="column" align="center" gap="sm">
          <Ionicons name="warning-outline" size={48} color={colors.warning} />
          <Text weight="bold" tone="danger">
            Limite de requisições da API atingido
          </Text>
          <Text tone="muted" size="sm">
            Aguarde alguns minutos ou configure um token de acesso no arquivo .env para aumentar o
            limite.
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
