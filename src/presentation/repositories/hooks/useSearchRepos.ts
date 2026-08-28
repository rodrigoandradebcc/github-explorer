import { useInfiniteQuery } from '@tanstack/react-query';

import { useRepoService } from '@/presentation/providers/ApplicationProvider';
import { useDataSourceScope } from '@/presentation/providers/DataSourceProvider';
import { queryKeys } from '@/presentation/shared/queryKeys';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export function useSearchRepos(query: string) {
  const repositories = useRepoService();
  const scope = useDataSourceScope();

  return useInfiniteQuery({
    queryKey: queryKeys.repositories.search(scope, query),
    queryFn: ({ pageParam, signal }) => repositories.search(query, pageParam, { signal }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: query.trim().length > 0,
    staleTime: FIVE_MINUTES_MS,
  });
}
