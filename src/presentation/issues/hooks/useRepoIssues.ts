import { useInfiniteQuery } from '@tanstack/react-query';

import { useIssueService } from '@/presentation/di/ApplicationProvider';
import { useDataSourceScope } from '@/presentation/di/DataSourceProvider';
import { queryKeys } from '@/presentation/shared/queryKeys';

export function useRepoIssues(owner: string, repo: string) {
  const issues = useIssueService();
  const scope = useDataSourceScope();

  return useInfiniteQuery({
    queryKey: queryKeys.repositories.issues(scope, owner, repo),
    queryFn: ({ pageParam, signal }) => issues.listOpen(owner, repo, pageParam, { signal }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: owner.length > 0 && repo.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
