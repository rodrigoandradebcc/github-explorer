import React from 'react';

import { Box, Card, Skeleton } from '@/design-system';

export function IssueSkeleton() {
  return (
    <Card>
      <Box direction="column" gap="sm">
        <Skeleton width="90%" height={16} />
        <Skeleton width="70%" height={16} />
        <Box direction="row" gap="xs">
          <Skeleton width={56} height={20} radius="lg" />
          <Skeleton width={56} height={20} radius="lg" />
        </Box>
        <Box direction="row" align="center" gap="xs">
          <Skeleton width={24} height={24} radius="lg" />
          <Skeleton width={80} height={12} />
          <Skeleton width={60} height={12} />
        </Box>
      </Box>
    </Card>
  );
}
