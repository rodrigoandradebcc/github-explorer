import React from 'react';
import { ScrollView } from 'react-native';

import { Box, Card, Skeleton } from '@/design-system';

export function RepositoryDetailSkeleton() {
  return (
    <ScrollView>
      <Box padding="md" direction="column" gap="md">
        <Card>
          <Box direction="column" gap="sm">
            <Box direction="row" align="center" gap="md">
              <Skeleton width={64} height={64} radius="lg" />
              <Box direction="column" gap="xs" flex={1}>
                <Skeleton width="40%" height={12} />
                <Skeleton width="70%" height={24} />
              </Box>
            </Box>
            <Skeleton width="90%" height={14} />
            <Skeleton width="80%" height={14} />
          </Box>
        </Card>
        <Card>
          <Box direction="row" gap="sm">
            <Skeleton width={80} height={28} radius="lg" />
            <Skeleton width={80} height={28} radius="lg" />
            <Skeleton width={80} height={28} radius="lg" />
            <Skeleton width={80} height={28} radius="lg" />
          </Box>
        </Card>
        <Skeleton height={44} />
      </Box>
    </ScrollView>
  );
}
