import React from 'react';

import { Box, Card, Skeleton } from '@/design-system';

export function RepositoryCardSkeleton({ testID }: { testID?: string }) {
  return (
    <Card padding="md" testID={testID}>
      <Box direction="column" gap="sm">
        {/* owner row */}
        <Box direction="row" align="center" gap="xs">
          <Skeleton width={32} height={32} radius="lg" />
          <Skeleton width={80} height={12} />
        </Box>
        {/* repo name */}
        <Skeleton width="60%" height={18} radius="sm" />
        {/* description */}
        <Box direction="column" gap="xs">
          <Skeleton width="100%" height={14} />
          <Skeleton width="80%" height={14} />
        </Box>
        {/* footer */}
        <Box direction="row" gap="sm" paddingTop="xs">
          <Skeleton width={56} height={20} radius="lg" />
          <Skeleton width={40} height={20} radius="sm" />
        </Box>
      </Box>
    </Card>
  );
}
