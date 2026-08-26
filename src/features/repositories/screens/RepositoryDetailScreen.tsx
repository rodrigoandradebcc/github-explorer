import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

import { useTheme } from '@/design-system';
import { GithubApiErrorState } from '@/features/github/components/GithubApiErrorState';
import { getGithubStackScreenOptions } from '@/features/github/navigation/getGithubStackScreenOptions';
import { useRepository } from '@/features/repositories/hooks/useRepository';
import { ApiError } from '@/infrastructure/github/client';

import { RepositoryDetailContent } from '../components/RepositoryDetailContent';
import { RepositoryDetailSkeleton } from '../components/RepositoryDetailSkeleton';

export function RepositoryDetailScreen() {
  const { owner, repo } = useLocalSearchParams<{ owner: string; repo: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { data, isLoading, isError, error, refetch } = useRepository(owner, repo);

  const isRateLimit = error instanceof ApiError && error.isRateLimit;
  const title = typeof repo === 'string' ? repo : undefined;
  const headerOptions = getGithubStackScreenOptions({ title, colors });

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
        <GithubApiErrorState
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
        options={getGithubStackScreenOptions({
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
