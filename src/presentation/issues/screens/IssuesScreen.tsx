import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';

import { Box, useTheme } from '@/design-system';
import { DataAccessErrorState } from '@/presentation/shared/components/DataAccessErrorState';
import { getStackScreenOptions } from '@/presentation/shared/navigation/getStackScreenOptions';
import { isRateLimitError } from '@/domain/errors/DataAccessError';
import { IssueCard } from '@/presentation/issues/components/IssueCard';
import { IssuesEmptyState } from '@/presentation/issues/components/IssuesEmptyState';
import { IssuesSkeletonList } from '@/presentation/issues/components/IssuesSkeletonList';
import { useRepoIssues } from '@/presentation/issues/hooks/useRepoIssues';
import type { Issue } from '@/domain/entities/Issue';

export function IssuesScreen() {
  const { owner, repo } = useLocalSearchParams<{ owner: string; repo: string }>();
  const { colors } = useTheme();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useRepoIssues(owner, repo);

  const isRateLimit = isRateLimitError(error);
  const issues = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item, index }: { item: Issue; index: number }) => (
      <Box paddingHorizontal="md" paddingBottom="sm">
        <IssueCard issue={item} index={index} />
      </Box>
    ),
    [],
  );

  const ListFooter = useMemo(
    () => (
      <>
        {isFetchingNextPage && (
          <Box paddingVertical="md" align="center">
            <ActivityIndicator color={colors.primary} />
          </Box>
        )}
        <Box paddingBottom="xl" />
      </>
    ),
    [isFetchingNextPage, colors.primary],
  );

  const title = `Issues · ${repo}`;
  const headerOptions = getStackScreenOptions({ title, colors });

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <IssuesSkeletonList />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <DataAccessErrorState
          isRateLimit={isRateLimit}
          genericMessage="Não foi possível carregar as issues."
          testID="issues-error"
          retryTestID="issues-retry-button"
          onRetry={refetch}
        />
      </>
    );
  }

  if (issues.length === 0) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <IssuesEmptyState />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <FlatList
        data={issues}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={<Box paddingTop="sm" />}
        ListFooterComponent={ListFooter}
        contentInsetAdjustmentBehavior="automatic"
        testID="issues-list"
      />
    </>
  );
}
