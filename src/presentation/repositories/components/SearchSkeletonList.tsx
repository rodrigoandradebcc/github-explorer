import React from 'react';

import { Box } from '@/design-system';

import { RepositoryCardSkeleton } from './RepositoryCardSkeleton';

const SKELETON_COUNT = 6;
const SKELETON_KEYS = Array.from({ length: SKELETON_COUNT }, (_, i) => String(i));

export function SearchSkeletonList() {
  return (
    <Box flex={1} paddingTop="sm" testID="skeleton-list">
      {SKELETON_KEYS.map((key) => (
        <Box key={key} paddingHorizontal="md" paddingBottom="sm">
          <RepositoryCardSkeleton testID={`repo-card-skeleton-${key}`} />
        </Box>
      ))}
    </Box>
  );
}
