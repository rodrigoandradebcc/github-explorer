import React from 'react';

import { Box } from '@/design-system';

import { IssueSkeleton } from './IssueSkeleton';

const SKELETON_COUNT = 5;
const SKELETON_KEYS = Array.from({ length: SKELETON_COUNT }, (_, i) => String(i));

export function IssuesSkeletonList() {
  return (
    <Box flex={1} paddingTop="sm" testID="issues-skeleton">
      {SKELETON_KEYS.map((key) => (
        <Box key={key} paddingHorizontal="md" paddingBottom="sm">
          <IssueSkeleton />
        </Box>
      ))}
    </Box>
  );
}
