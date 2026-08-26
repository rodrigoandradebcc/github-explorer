import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

import { useTheme } from '@/design-system';
import { DataAccessErrorState } from '@/presentation/shared/components/DataAccessErrorState';
import { getStackScreenOptions } from '@/presentation/shared/navigation/getStackScreenOptions';
import { isRateLimitError } from '@/domain/errors/DataAccessError';
import { useRepoDetails } from '@/presentation/repositories/hooks/useRepoDetails';

import { RepositoryDetailContent } from '../components/RepositoryDetailContent';
import { RepositoryDetailSkeleton } from '../components/RepositoryDetailSkeleton';

export function RepositoryDetailScreen() {
  const { owner, repo } = useLocalSearchParams<{ owner: string; repo: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { data, isLoading, isError, error, refetch } = useRepoDetails(owner, repo);

  const isRateLimit = isRateLimitError(error);
  const title = typeof repo === 'string' ? repo : undefined;
  const headerOptions = getStackScreenOptions({ title, colors });

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <RepositoryDetailSkeleton />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <DataAccessErrorState
          isRateLimit={isRateLimit}
          genericMessage="Não foi possível carregar os detalhes do repositório."
          testID="detail-error"
          retryTestID="detail-retry-button"
          onRetry={refetch}
        />
      </>
    );
  }

  if (data === undefined) return null;

  return (
    <>
      <Stack.Screen
        options={getStackScreenOptions({
          title: `${data.owner.login}/${data.name}`,
          colors,
        })}
      />
      <RepositoryDetailContent
        repository={data}
        onViewIssues={() => router.push(`/repository/${owner}/${repo}/issues`)}
      />
    </>
  );
}
