import { useInfiniteQuery } from '@tanstack/react-query';

import { repositoryRepository } from '@/infrastructure/github/GitHubRepositoryRepository';
import { queryKeys } from '@/services/queryKeys';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export function useSearchRepositories(query: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.repositories.search(query),
    queryFn: ({ pageParam }) => repositoryRepository.search(query, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: query.trim().length > 0,
    staleTime: FIVE_MINUTES_MS,
  });
}
